export interface Alert {
  alertCode: {
    code: string
  }
  activeFrom: string
}

export interface AlertDto {
  content: Alert[]
}
