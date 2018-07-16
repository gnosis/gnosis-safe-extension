import React from 'react'

import styles from 'assets/css/global.css'

const SimpleHeader = ({
  noBorder,
}) => (
    <header className={noBorder ? styles.noBorder : null}>
      <span className={styles.safeIcon}></span>
    </header>
  )

export default SimpleHeader
