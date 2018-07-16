import React, { Component } from 'react'
import { Link } from 'react-router-dom'

import { createQrImage } from 'utils/qrdisplay'
import styles from 'assets/css/global.css'

class AppQr extends Component {
  constructor(props) {
    super(props)
  }

  componentDidMount = () => {
    const { link } = this.props

    createQrImage(
      document.getElementById('qr-app'),
      link,
      4
    )
  }

  handleOpenApp = (url) => (e) => {
    chrome.tabs.create({ url })
  }

  render() {
    const {
      toggleQr,
      os,
      link,
      storeImage,
    } = this.props

    return (
      <div className={styles.innerOverlay}>
        <button
          className={styles.buttonExit}
          onClick={toggleQr}
        ></button>
        <div className={styles.innerOverlayContent}>
          <span className={styles.QR}>
            <p>GNOSIS SAFE<br />FOR {os}</p>
            <div id='qr-app'></div>
          </span>
          <img
            src={storeImage}
            onClick={this.handleOpenApp(link)}
            height='40'
            width='135'
          />
        </div>
      </div>
    )
  }
}

export default AppQr
