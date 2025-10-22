import { useState, useCallback } from 'react'

export interface DialogConfig {
  title?: string
  message: string
  type?: 'info' | 'confirm' | 'error' | 'success'
  confirmText?: string
  cancelText?: string
  showCancel?: boolean
  onConfirm?: () => void
  onCancel?: () => void
}

export interface DialogState extends DialogConfig {
  isOpen: boolean
}

export function useDialog() {
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    message: '',
    type: 'info',
    confirmText: 'OK',
    cancelText: 'Cancel',
    showCancel: false,
  })

  const showDialog = useCallback((config: DialogConfig) => {
    setDialogState({
      isOpen: true,
      title: config.title,
      message: config.message,
      type: config.type || 'info',
      confirmText: config.confirmText || 'OK',
      cancelText: config.cancelText || 'Cancel',
      showCancel: config.showCancel ?? false,
      onConfirm: config.onConfirm,
      onCancel: config.onCancel,
    })
  }, [])

  const showAlert = useCallback((message: string, title?: string) => {
    showDialog({
      title: title || 'Notice',
      message,
      type: 'info',
      showCancel: false,
    })
  }, [showDialog])

  const showConfirm = useCallback((
    message: string,
    onConfirm?: () => void,
    onCancel?: () => void,
    title?: string
  ) => {
    showDialog({
      title: title || 'Confirm',
      message,
      type: 'confirm',
      showCancel: true,
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      onConfirm,
      onCancel,
    })
  }, [showDialog])

  const showError = useCallback((message: string, title?: string) => {
    showDialog({
      title: title || 'Error',
      message,
      type: 'error',
      showCancel: false,
    })
  }, [showDialog])

  const showSuccess = useCallback((message: string, title?: string) => {
    showDialog({
      title: title || 'Success',
      message,
      type: 'success',
      showCancel: false,
    })
  }, [showDialog])

  const hideDialog = useCallback(() => {
    setDialogState(prev => ({ ...prev, isOpen: false }))
  }, [])

  const handleConfirm = useCallback(() => {
    if (dialogState.onConfirm) {
      dialogState.onConfirm()
    }
    hideDialog()
  }, [dialogState.onConfirm, hideDialog])

  const handleCancel = useCallback(() => {
    if (dialogState.onCancel) {
      dialogState.onCancel()
    }
    hideDialog()
  }, [dialogState.onCancel, hideDialog])

  return {
    dialogState,
    showDialog,
    showAlert,
    showConfirm,
    showError,
    showSuccess,
    hideDialog,
    handleConfirm,
    handleCancel,
  }
}

