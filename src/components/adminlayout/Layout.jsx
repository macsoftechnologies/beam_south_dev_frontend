import React, { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import Sidebar from './Sidebar/Sidebar'
import Navbar from './Navbar/Navbar'
import Footer from './Footer/Footer'
import { syncActiveModuleRole } from '../../utils/modulePermissions'

import './Layout.css'

function Layout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768)

  useEffect(() => {
    syncActiveModuleRole(location.pathname)
  }, [location.pathname])

  const [theme, setTheme] = useState(() => {
  const saved = localStorage.getItem('app-theme') || 'default-dark'
  // Apply immediately BEFORE first render so no flash
  document.documentElement.setAttribute('data-theme', saved)
  return saved
})

useEffect(() => {
  const html = document.documentElement
  html.setAttribute('data-theme', theme)

  // Force page-content background directly via the resolved CSS variable
  const bg = getComputedStyle(html).getPropertyValue('--main-bg').trim()
  document.body.style.background = ''
  document.body.style.color = ''

  // Apply to page-content elements directly to override any component CSS
  document.querySelectorAll('.page-content, .main-content-area, .layout-root')
    .forEach(el => {
      el.style.backgroundColor = bg
    })

  localStorage.setItem('app-theme', theme)
}, [theme])

  return (
    <div className="layout-root">

      <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(p => !p)} />

      <div
          className={`sidebar-backdrop ${sidebarOpen ? 'visible' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />

      <div className={`main-content-area ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>

        <Navbar
          toggleSidebar={() => setSidebarOpen(p => !p)}
          theme={theme}
          onThemeChange={setTheme}
        />

        <div className="page-content">
          <Outlet />
        </div>

        <Footer />

      </div>
    </div>
  )
}

export default Layout