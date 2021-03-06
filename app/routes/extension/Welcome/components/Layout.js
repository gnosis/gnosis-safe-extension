import React from 'react'
import classNames from 'classnames/bind'
import Page from 'components/layout/Page'
import Button from 'components/layout/Button'
import Disclaimer from './Disclaimer'
import { getNetwork } from '../../../../../config'
import { GET_STARTED, SLOGAN } from '../../../../../config/messages'
import styles from './style.css'

const cx = classNames.bind(styles)

const Layout = ({ showDisclaimer, toggleDisclaimer }) => (
  <React.Fragment>
    <Page withoutHeader background="mountains">
      <div className={styles.content}>
        <span
          className={cx(styles.safeLogo, styles.animated, styles.fadeInUp)}
          data-network={getNetwork()}
        />
        <h1>{SLOGAN}</h1>
        <Button onClick={toggleDisclaimer}>{GET_STARTED}</Button>
      </div>
    </Page>
    <Disclaimer
      showDisclaimer={showDisclaimer}
      toggleDisclaimer={toggleDisclaimer}
    />
  </React.Fragment>
)

export default Layout
