export interface CardTokenizePayload {
  number: string;
  cvc: string;
  exp_month: string;
  exp_year: string;
  card_holder: string;
}

export interface CardTokenResponse {
  status: string;
  data: {
    id: string;
    created_at: string;
    brand: string;
    name: string;
    last_four: string;
    bin: string;
    exp_year: string;
    exp_month: string;
    card_holder: string;
    expires_at: string;
  };
}

/**
 * Tokeniza una tarjeta de crédito/débito directamente contra la API pública de la pasarela.
 *
 * Cumplimiento de estándares de seguridad (PCI-DSS):
 * 1. Los datos de la tarjeta son enviados directamente desde el navegador del cliente
 *    a los servidores certificados de la pasarela mediante HTTPS seguro.
 * 2. El backend del comercio nunca recibe ni almacena información de tarjetas de crédito.
 * 3. Se autentica con la llave pública del comercio (`Bearer pub_...`), soportando CORS de forma nativa.
 *
 * @param payload - Datos de la tarjeta ingresados por el usuario
 * @param publicKey - Llave pública de la pasarela obtenida desde el endpoint de merchant
 * @param apiUrl - URL base de la API de la pasarela (opcional, fallback a sandbox)
 * @returns ID del token de la tarjeta (ej. "tok_stagtest_xxx")
 */
export async function tokenizeCard(
  payload: CardTokenizePayload,
  publicKey?: string,
  apiUrl?: string
): Promise<string> {
  const sanitizedNumber = payload.number.replace(/\D/g, '');
  const sanitizedCvc = payload.cvc.replace(/\D/g, '');
  const sanitizedExpMonth = payload.exp_month.replace(/\D/g, '').padStart(2, '0');
  let sanitizedExpYear = payload.exp_year.replace(/\D/g, '');
  if (sanitizedExpYear.length === 4) {
    sanitizedExpYear = sanitizedExpYear.slice(-2);
  }

  const cleanPayload = {
    number: sanitizedNumber,
    cvc: sanitizedCvc,
    exp_month: sanitizedExpMonth,
    exp_year: sanitizedExpYear,
    card_holder: payload.card_holder.trim(),
  };

  const key = publicKey || process.env.REACT_APP_GATEWAY_PUBLIC_KEY || '';
  const gatewayUrl = apiUrl || process.env.REACT_APP_GATEWAY_SANDBOX_URL || process.env.REACT_APP_GATEWAY_API_URL || '';

  if (!key) {
    throw new Error('No se encontró la llave pública de la pasarela para tokenizar la tarjeta.');
  }

  try {
    const response = await fetch(`${gatewayUrl}/tokens/cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(cleanPayload),
    });

    const data = await response.json();

    if (!response.ok || data.status !== 'CREATED' || !data.data?.id) {
      const errorData = data?.error || data;
      let message = 'Error al comunicarse con la pasarela de pagos';

      if (errorData?.messages && typeof errorData.messages === 'object') {
        const fieldTranslations: Record<string, string> = {
          card_holder: 'Titular de la tarjeta',
          number: 'Número de tarjeta',
          cvc: 'Código de seguridad (CVC)',
          exp_month: 'Mes de vencimiento',
          exp_year: 'Año de vencimiento',
        };

        const msgs = Object.entries(errorData.messages)
          .map(([field, errs]) => {
            const label = fieldTranslations[field] || field;
            const detail = Array.isArray(errs) ? errs.join(', ') : String(errs);
            return `${label}: ${detail}`;
          })
          .join('. ');

        message = msgs || errorData.type || message;
      } else if (errorData?.reason) {
        message = errorData.reason;
      } else if (errorData?.type) {
        message = errorData.type;
      } else if (errorData?.message) {
        message = errorData.message;
      }

      throw new Error(message);
    }

    return data.data.id;
  } catch (err: any) {
    if (err.message) {
      throw err;
    }
    throw new Error('Error al conectar con el servicio de pagos. Revisa tu conexión a internet.');
  }
}
