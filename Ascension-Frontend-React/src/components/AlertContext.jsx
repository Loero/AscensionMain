import { createContext, useContext, useState } from "react"
import "./Alert.css"

const AlertContext = createContext()

export function AlertProvider({ children }) {
  const [alertState, setAlertState] = useState({
    isOpen: false,
    type: "alert",
    message: "",
    resolve: null,
  })

  const showAlert = (message) => {
    return new Promise((resolve) => {
      setAlertState({
        isOpen: true,
        type: "alert",
        message,
        resolve,
      })
    })
  }

  const showConfirm = (message) => {
    return new Promise((resolve) => {
      setAlertState({
        isOpen: true,
        type: "confirm",
        message,
        resolve,
      })
    })
  }

  const handleClose = () => {
    alertState.resolve?.(false)
    setAlertState({ ...alertState, isOpen: false })
  }

  const handleConfirm = () => {
    alertState.resolve?.(true)
    setAlertState({ ...alertState, isOpen: false })
  }

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      {alertState.isOpen && (
        <div className="alert-overlay">
          <div className="alert-modal">
            <p className="alert-message">{alertState.message}</p>

            <div className="alert-buttons">
              {alertState.type === "confirm" && (
                <button className="alert-btn cancel" onClick={handleClose}>
                  Mégse
                </button>
              )}

              <button className="alert-btn confirm" onClick={handleConfirm}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  )
}

export function useAlert() {
  return useContext(AlertContext)
}