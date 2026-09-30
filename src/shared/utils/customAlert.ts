import { triggerGlobalAlert, AlertType } from '../components/GlobalFloatingAlert';

export function showAlert(
  title: string,
  message?: string,
  buttons?: { text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }[],
  type: AlertType = 'danger'
) {
  let alertType: AlertType = type;
  const lowerTitle = title.toLowerCase();

  if (
    lowerTitle.includes('éxito') ||
    lowerTitle.includes('exito') ||
    lowerTitle.includes('enviado') ||
    lowerTitle.includes('correctamente')
  ) {
    alertType = 'success';
  } else if (
    lowerTitle.includes('aviso') ||
    lowerTitle.includes('inválido') ||
    lowerTitle.includes('invalido') ||
    lowerTitle.includes('desarrollo') ||
    lowerTitle.includes('límite') ||
    lowerTitle.includes('limite')
  ) {
    alertType = 'warning';
  }

  triggerGlobalAlert({
    visible: true,
    title,
    message,
    type: alertType,
    buttons,
  });
}
