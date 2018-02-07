import React, { Component } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import wallet from 'ethereumjs-wallet'
import HdKey from 'ethereumjs-wallet/hdkey'
import Bip39 from 'bip39'
import { createAccount } from '../../actions/account';

class CreateAccount extends Component {
  constructor(props) {
    super(props)

    this.state = {
      password: '',
      confirmPassword: '',
      errorMessage: '',
    }
  }

  updatePassword(password) {
    this.setState({ password })
  }

  updateConfirmPassword(confirmPassword) {
    this.setState({ confirmPassword })
  }

  validatePasswords() {
    const { password, confirmPassword } = this.state

    if (!password || password.length < 10) {
      this.setState({ errorMessage: 'Password too short (min 10 chars)' })
      return false
    }

    if (password !== confirmPassword) {
      this.setState({ errorMessage: 'Passwords don\'t match' })
      return false
    }

    this.setState({ errorMessage: '' })
    return true
  }

  handleCreateAccount() {
    if (this.validatePasswords()) {
      const mnemonic = Bip39.generateMnemonic()
      const seed = Bip39.mnemonicToSeed(mnemonic)
      //console.log(mnemonic)

      const hdWallet = HdKey.fromMasterSeed(seed)

      // Get the first account using the standard hd path
      const walletHdPath = 'm/44\'/60\'/0\'/0'
      const v3 = hdWallet.derivePath(walletHdPath + '0').getWallet().toV3(this.state.password)

      //chrome.storage.local.set({'gnosisSafeWallet': v3}, function() {})
      this.props.onCreateAccount(this.state.password, v3)

      this.props.history.push('/account')
    }
  }

  handleRestoreAccount() {
    if (this.validatePasswords()) {
      this.props.onCreateAccount(this.state.password, null)
      
      this.props.history.push('/restore-account')
    }
  }

  render() {
    const { password, confirmPassword, errorMessage } = this.state

    return (
      <div>
        <input
          type='password'
          placeholder='New password'
          value={password}
          onChange={(e) => this.updatePassword(e.target.value)} />

        <input
          type='password'
          placeholder='Confirm password'
          value={confirmPassword}
          onChange={(e) => this.updateConfirmPassword(e.target.value)} />

        <p>{errorMessage}</p>

        <button onClick={() => this.handleCreateAccount()}> Create account </button>

        <button onClick={() => this.handleRestoreAccount()}> Restore account </button>
      </div>
    )
  }

}

const mapDispatchToProps = (dispatch) => {
  return {
    onCreateAccount: (password, v3) => dispatch(createAccount(password, v3))
  }
}

export default withRouter(connect(
  null,
  mapDispatchToProps
)(CreateAccount))