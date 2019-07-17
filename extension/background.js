import uuid from 'uuid/v4'
import EthUtil from 'ethereumjs-util'
import { normalizeUrl } from 'utils/helpers'
import messages from './utils/messages'
import StorageController from './utils/storageController'
import PopupController from './utils/popupController'
import { lockAccount, incrementCurrentAccountIndex } from 'actions/account'
import { addSafe } from 'actions/safes'
import { updateDeviceData } from 'actions/device'
import { addTransaction, removeAllTransactions } from 'actions/transactions'
import { getAppVersionNumber, getAppBuildNumber } from '../config'
import { addSignMessage, removeAllSignMessage } from 'actions/signMessages'
import { type TypedDataMessage, makeTypedDataMessage } from 'routes/popup/SignMessage/store/models/typedDataMessage'
import { SAFE_ALREADY_EXISTS } from '../config/messages'
import { ADDRESS_ZERO } from '../app/utils/helpers'

const storageController = new StorageController()
const popupController = new PopupController({ storageController })

storageController.store.subscribe(() => {
  updateCurrentSafe()
  storageController.saveStorage(storageController.getStoreState())
})

let storeCurrentSafeAddress

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.update()
    }
  })
}

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install' || details.reason === 'update') {
    storageController
      .getStore()
      .dispatch(updateDeviceData(getAppVersionNumber(), getAppBuildNumber()))
  }
})

const updateCurrentSafe = () => {
  let storePreviousSafeAddress = storeCurrentSafeAddress
  storeCurrentSafeAddress = storageController.getStoreState().safes.currentSafe

  if (storeCurrentSafeAddress !== storePreviousSafeAddress) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        msg: messages.MSG_UPDATE_CURRENT_SAFE,
        newSafeAddress: storeCurrentSafeAddress.toLowerCase()
      })
    })
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.msg) {
    case messages.MSG_ALLOW_INJECTION:
      allowInjection(request.url, sendResponse)
      break

    case messages.MSG_SHOW_POPUP_TX:
      if (isWhiteListedDapp(normalizeUrl(sender.tab.url))) {
        showSendTransactionPopup(request.tx, sender.tab.windowId, sender.tab.id)
      }
      break

    case messages.MSG_SHOW_POPUP_SIGNATURE:
      if (isWhiteListedDapp(normalizeUrl(sender.tab.url))) {
        showSendSignaturePopup(
          request.message,
          sender.tab.windowId,
          sender.tab.id,
          normalizeUrl(sender.tab.url)
        )
      }
      break

    case messages.MSG_LOCK_ACCOUNT_TIMER:
      lockAccountTimer()
      break

    case messages.MSG_LOCK_ACCOUNT:
      lockAccountNow()
      break

    case messages.MSG_CONFIGURE_ACCOUNT_LOCKING:
      lockAccountTimer()
      break

    case messages.MSG_PENDING_SENDTRANSACTION:
      setPendingTransaction(request.position)
      break

    default:
  }
})

const allowInjection = (url, sendResponse) => {
  const allowInjection = isWhiteListedDapp(normalizeUrl(url))
  const currentSafe = allowInjection
    ? storageController.getStoreState().safes.currentSafe.toLowerCase()
    : undefined

  sendResponse({
    msg: messages.MSG_RESP_ALLOW_INJECTION,
    answer: allowInjection,
    currentSafe
  })
}

const isWhiteListedDapp = (dApp) => {
  var safeStorage = storageController.loadStorage()

  if (safeStorage !== null) {
    var whitelistedDapps = safeStorage.whitelistedDapps

    if (whitelistedDapps !== undefined) {
      if (whitelistedDapps.indexOf(dApp) > -1) {
        return true
      }
    }
  }
  return false
}

const showTransactionPopup = (transaction, dappWindowId, dappTabId) => {
  const safes = storageController.getStoreState().safes.safes
  const transactions = storageController.getStoreState().transactions.txs

  if (
    transaction.hash &&
    transactions.filter((t) => t.tx.hash === transaction.hash).length > 0
  ) {
    return
  }

  transaction.safe =
    transaction.safe && EthUtil.toChecksumAddress(transaction.safe)
  transaction.from =
    transaction.from && EthUtil.toChecksumAddress(transaction.from)
  transaction.to = transaction.to && EthUtil.toChecksumAddress(transaction.to)
  if (transaction.safe) {
    transaction.from = transaction.safe
  }
  if (
    transaction.gasToken === '0' ||
    transaction.gasToken === '0x' ||
    transaction.gasToken === '0x0'
  ) {
    transaction.gasToken = ADDRESS_ZERO
  }

  const validTransaction =
    safes.filter(
      (safe) => safe.address.toLowerCase() === transaction.from.toLowerCase()
    ).length > 0
  if (!validTransaction) {
    return
  }

  const transactionsLength = transactions.length + 1
  chrome.browserAction.setBadgeBackgroundColor({ color: '#888' })
  chrome.browserAction.setBadgeText({ text: transactionsLength.toString() })

  if (transactions.length === 0) {
    popupController.showPopup((window) =>
      storageController
        .getStore()
        .dispatch(
          addTransaction(transaction, window.id, dappWindowId, dappTabId)
        )
    )
    return
  }

  storageController
    .getStore()
    .dispatch(addTransaction(transaction, null, dappWindowId, dappTabId))
  popupController.focusPopup()
}

const showConfirmTransactionPopup = (transaction) => {
  transaction.type = 'confirmTransaction'
  transaction.id = uuid()
  showTransactionPopup(transaction)
}

const showSendTransactionPopup = (transaction, dappWindowId, dappTabId) => {
  transaction.type = 'sendTransaction'
  const paymentToken = storageController.getStoreState().transactions
    .paymentToken
  transaction.gasToken = paymentToken ? paymentToken.address : ADDRESS_ZERO
  showTransactionPopup(transaction, dappWindowId, dappTabId)
}

const showSignaturePopup = (typedDataMessage: TypedDataMessage, dappWindowId, dappTabId) => {
  chrome.browserAction.setBadgeBackgroundColor({ color: '#888' })
  chrome.browserAction.setBadgeText({ text: '1' })

  popupController.showPopup((window) =>
    storageController
      .getStore()
      .dispatch(addSignMessage(typedDataMessage, window.id, dappWindowId, dappTabId))
  )
}

const showConfirmSignaturePopup = (payload) => {
  const currentSafe = storageController.getStoreState().safes.currentSafe

  const typedDataMessage: TypedDataMessage = makeTypedDataMessage({
    safeAddress: EthUtil.toChecksumAddress(currentSafe),
    message: payload.payload,
    type: 'confirmSignMessage',
  })

  showSignaturePopup(typedDataMessage)
}

const showSendSignaturePopup = (
  message,
  dappWindowId,
  dappTabId,
  senderUrl
) => {
  const currentSafe = storageController.getStoreState().safes.currentSafe

  const typedDataMessage: TypedDataMessage = makeTypedDataMessage({
    safeAddress: EthUtil.toChecksumAddress(currentSafe),
    message: message[1],
    type: 'sendSignMessage',
    origin: senderUrl
  })

  showSignaturePopup(typedDataMessage, dappWindowId, dappTabId)
}

let lockingTimer = null
const lockAccountTimer = () => {
  if (lockingTimer !== null) {
    clearTimeout(lockingTimer)
  }

  const waitMinutes = storageController.getStoreState().account.autoLockInterval

  lockingTimer = setTimeout(() => {
    storageController.getStore().dispatch(lockAccount())
  }, waitMinutes * 60000)
}

const lockAccountNow = () => {
  if (lockingTimer !== null) {
    clearTimeout(lockingTimer)
  }
  storageController.getStore().dispatch(lockAccount())
}

let pendingTransactionPosition = null
const setPendingTransaction = (position) => {
  pendingTransactionPosition = position
}

chrome.windows.onRemoved.addListener((windowId) => {
  const signMessages = storageController.getStoreState().signMessages
  const transactions = storageController.getStoreState().transactions

  if (transactions && windowId === transactions.windowId) {
    chrome.browserAction.setBadgeText({ text: '' })

    for (const transaction of transactions.txs) {
      if (transaction.dappWindowId && transaction.dappTabId) {
        chrome.tabs.query({ windowId: transaction.dappWindowId }, function(
          tabs
        ) {
          chrome.tabs.sendMessage(transaction.dappTabId, {
            msg: messages.MSG_RESOLVED_TRANSACTION,
            hash: null,
            id: transaction.tx.id
          })
        })
      }
    }
    storageController.getStore().dispatch(removeAllTransactions())
    popupController.handleClosePopup()
  }

  if (signMessages && windowId === signMessages.windowId) {
    chrome.browserAction.setBadgeText({ text: '' })

    if (signMessages.dappWindowId && signMessages.dappTabId) {
      chrome.tabs.query({ windowId: signMessages.dappWindowId }, function(
        tabs
      ) {
        chrome.tabs.sendMessage(signMessages.dappTabId, {
          msg: messages.MSG_RESOLVED_WALLET_SIGN_TYPED_DATA,
          walletSignature: null
        })
      })
    }
    storageController.getStore().dispatch(removeAllSignMessage())
    popupController.handleClosePopup()
  }
})

storageController.getStore().dispatch(lockAccount())
storageController.getStore().dispatch(removeAllTransactions())
storageController.getStore().dispatch(removeAllSignMessage())

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    const payload = event.data

    switch (payload.type) {
      case 'safeCreation':
        safeCreation(payload)
        break

      case 'requestConfirmation':
        showConfirmTransactionPopup(payload)
        break

      case 'sendTransactionHash':
        sendTransactionHash(payload, true)
        break

      case 'rejectTransaction':
        sendTransactionHash(payload, false)
        break

      case 'signTypedData':
        showConfirmSignaturePopup(payload)
        break

      case 'signTypedDataConfirmation':
        signTypedDataConfirmation(payload)
        break

      default:
    }
  })
}

const safeCreation = (payload) => {
  const safes = storageController.getStoreState().safes.safes
  const account = storageController.getStoreState().account

  const validSafeAddress =
    safes.filter(
      (safe) => safe.address.toLowerCase() === payload.safe.toLowerCase()
    ).length === 0

  if (safes.length > 0 && !validSafeAddress) {
    console.error(SAFE_ALREADY_EXISTS, payload.safe)
    return
  }
  const checksumedAddress = EthUtil.toChecksumAddress(payload.safe)
  const accountIndex = account.secondFA.currentAccountIndex
    ? account.secondFA.currentAccountIndex + 1
    : 1

  storageController
    .getStore()
    .dispatch(
      addSafe(checksumedAddress, accountIndex)
    )
  storageController.getStore().dispatch(incrementCurrentAccountIndex())
}

const sendTransactionHash = (payload, accepted) => {
  if (pendingTransactionPosition === null) {
    return
  }

  const popUpWindowId = storageController.getStoreState().transactions.windowId
  const pendingTx = storageController.getStoreState().transactions.txs[
    pendingTransactionPosition
  ]

  const transactionsLength =
    storageController.getStoreState().transactions.txs.length - 1
  chrome.browserAction.setBadgeBackgroundColor({ color: '#888' })
  chrome.browserAction.setBadgeText({
    text: transactionsLength < 0 ? '' : transactionsLength.toString()
  })

  chrome.tabs.query({ active: true, windowId: popUpWindowId }, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {
      msg: messages.MSG_RESOLVED_TRANSACTION,
      hash: accepted ? payload.chainHash : null,
      id: pendingTx.tx.id
    })
  })
  chrome.tabs.query({ windowId: pendingTx.dappWindowId }, function(tabs) {
    chrome.tabs.sendMessage(pendingTx.dappTabId, {
      msg: messages.MSG_RESOLVED_TRANSACTION,
      hash: accepted ? payload.chainHash : null,
      id: pendingTx.tx.id
    })
  })

  pendingTransactionPosition = null
}

const signTypedDataConfirmation = (payload) => {
  const popUpWindowId = storageController.getStoreState().signMessages.windowId

  chrome.tabs.query({ active: true, windowId: popUpWindowId }, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {
      msg: messages.MSG_RESOLVED_OWNER_SIGN_TYPED_DATA,
      hash: payload.hash,
      signature: payload.signature
    })
  })
}
