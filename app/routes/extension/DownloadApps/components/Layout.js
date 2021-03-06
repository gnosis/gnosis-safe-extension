import React from 'react'
import classNames from 'classnames/bind'
import Page from 'components/layout/Page'
import ContentHeader from 'components/Headers/ContentHeader'
import Paragraph from 'components/layout/Paragraph'
import googlePlayBadge from '../assets/google_play_badge.svg'
import appStoreBadge from '../assets/app_store_badge.svg'
import {
  CONNECTED_EXTENSION_SUCCESFULLY,
  DOWNLOAD_MOBILE_APP,
  CONNECT_EXTENSION_EXPLANATION
} from '../../../../../config/messages'
import { ACCOUNT_URL } from 'routes/routes'
import styles from './style.css'

const cx = classNames.bind(styles)

const Layout = ({
  location,
  openGooglePlay,
  openAppStore,
  iosAppUrl,
  qrPairingRef,
  message
}) => (
  <Page location={location} simpleHeader background="grey">
    <div className={styles.content}>
      {location.state.contentHeader ? (
        <ContentHeader backLink={ACCOUNT_URL} color="green" />
      ) : (
        <h1>{CONNECTED_EXTENSION_SUCCESFULLY}</h1>
      )}
      <div className={styles.innerContent}>
        <Paragraph className={styles.step}>{DOWNLOAD_MOBILE_APP}</Paragraph>
        <div className={styles.appStores}>
          {iosAppUrl && (
            <img
              src={appStoreBadge}
              onClick={openAppStore}
              height="40"
              width="135"
            />
          )}
          <img
            src={googlePlayBadge}
            onClick={openGooglePlay}
            height="40"
            width="135"
          />
        </div>
        <Paragraph className={cx(styles.step, styles.step2)}>
          {CONNECT_EXTENSION_EXPLANATION}
        </Paragraph>
        {message ? (
          <Paragraph className={styles.message}>{message}</Paragraph>
        ) : (
          <div className={styles.qrCode} ref={qrPairingRef} />
        )}
      </div>
    </div>
  </Page>
)

export default Layout
