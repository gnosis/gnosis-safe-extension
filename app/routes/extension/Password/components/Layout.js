import React from 'react'
import classNames from 'classnames'
import Page from 'components/layout/Page'
import TextInput from 'components/forms/TextInput'
import Button from 'components/layout/Button'
import { UNLOCK, ENTER_PASSWORD } from '../../../../../config/messages'
import styles from './style.css'

const cx = classNames.bind(styles)

const Layout = ({
  password,
  updatePassword,
  validatePasswords,
  dataValidation,
  location
}) => {
  const prevent = (e) => {
    e.preventDefault()
  }

  return (
    <Page withoutHeader background="mountains" location={location}>
      <div className={styles.content}>
        <span className={cx(styles.safeLogo)} />
        <form onSubmit={prevent}>
          <div className={styles.passwordForm}>
            <TextInput
              type="password"
              placeholder={ENTER_PASSWORD}
              value={password}
              onChange={updatePassword}
              autoFocus
              className={styles.passwordInput}
              dataValidation={dataValidation}
            />
            <Button onClick={validatePasswords} className={styles.button}>
              {UNLOCK}
            </Button>
          </div>
        </form>
      </div>
    </Page>
  )
}

export default Layout
