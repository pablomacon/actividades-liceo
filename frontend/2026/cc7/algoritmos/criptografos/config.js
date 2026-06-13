window.CRIPTOGRAFOS_CONFIG = {
  juegoSlug: "criptografos-01",
  apiBaseUrl: "https://backend-actividades-liceo.vercel.app/api",
  ciudadInicio: "Montevideo",
  ciudadDestino: "Rivera",

  // Se calcula de forma dinámica en cada partida:
  // interferenciaMaxima = mejor costo posible + margenInterferencia.
  interferenciaMaxima: 15,
  costoOptimo: 14,
  margenInterferencia: 4
};
