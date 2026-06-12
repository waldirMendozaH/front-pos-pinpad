import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const izipayErrorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let message = 'Error inesperado';

      if (error.status === 0 || error.status === 504) {
        message = 'El servicio Izipay Tray no esta disponible. Verifique que la aplicacion de escritorio este corriendo en https://localhost:8383';
      } else if (error.error instanceof ErrorEvent) {
        message = error.error.message || 'Error de conexion';
      } else if (typeof error.error === 'string' && error.error.startsWith('<!')) {
        message = 'El servicio Izipay Tray no esta disponible. Verifique que la aplicacion de escritorio este corriendo.';
      } else if (error.error?.error) {
        message = error.error.error;
      } else if (error.message?.includes('JSON')) {
        message = 'El servicio Izipay Tray no esta disponible. Respuesta inesperada del servidor.';
      }

      return throwError(() => ({ ...error, friendlyMessage: message }));
    })
  );
};
