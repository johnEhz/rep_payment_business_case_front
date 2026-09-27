import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const TermsPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    { id: 'uso', title: '1. Uso del Sitio y Compras' },
    { id: 'disponibilidad', title: '2. Disponibilidad de Productos' },
    { id: 'precios', title: '3. Precios e Impuestos' },
    { id: 'envios', title: '4. Envíos y Entregas' },
    { id: 'pagos', title: '5. Pagos Seguros' },
    { id: 'garantias', title: '6. Cambios, Devoluciones y Garantías' },
    { id: 'privacidad', title: '7. Privacidad y Protección de Datos' },
    { id: 'contacto', title: '8. Atención al Cliente' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Encabezado de la página */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              aria-label="Volver atrás"
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button onClick={() => navigate('/')} className="flex items-center gap-2.5 text-left group">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shadow-blue-500/30 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
                  <path d="M2 7h20" />
                  <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" />
                </svg>
              </div>
              <span className="font-bold text-gray-900 text-base sm:text-lg tracking-tight block leading-tight">
                Jhz<span className="text-blue-600">Shop</span>
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate('/')}
              className="btn-primary py-2 px-4 text-xs font-bold w-auto"
            >
              Ir a la Tienda
            </button>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 w-full">
        {/* Tarjeta de bienvenida informativa */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 sm:p-8 mb-8">
          <span className="inline-block text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full mb-3">
            Información para el Comprador
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Términos y Condiciones
          </h1>
          <p className="text-gray-600 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
            Aquí te explicamos de forma sencilla y transparente cómo funciona nuestra tienda, cómo protegemos tus compras y cuáles son tus derechos como cliente.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Navegación rápida lateral */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-28 bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Temas de consulta
            </h2>
            <nav className="space-y-1">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="block text-xs py-2 px-2.5 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 transition-colors font-medium"
                >
                  {s.title}
                </a>
              ))}
            </nav>
            <div className="mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={() => navigate('/checkout')}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors text-center"
              >
                Volver al Checkout
              </button>
            </div>
          </aside>

          {/* Secciones informativas */}
          <article className="lg:col-span-8 space-y-6">
            {/* 1. Uso del Sitio y Compras */}
            <section id="uso" className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-7 shadow-xs">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
                1. Uso del Sitio y Compras
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Nuestra plataforma te permite explorar productos y realizar pedidos en línea de forma rápida y sencilla. Al ingresar tus datos y realizar un pedido, aceptas las condiciones aquí descritas para garantizar una experiencia de compra clara y segura.
              </p>
            </section>

            {/* 2. Disponibilidad de Productos */}
            <section id="disponibilidad" className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-7 shadow-xs">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
                2. Disponibilidad de Productos
              </h2>
              <div className="space-y-2.5 text-sm text-gray-600 leading-relaxed">
                <p>
                  Mostramos en tiempo real la disponibilidad de cada artículo. Al avanzar al paso de pago con tu tarjeta, los productos de tu carrito se apartan exclusivamente para ti durante <strong>15 minutos</strong> para que puedas completar tu compra con tranquilidad.
                </p>
                <p>
                  Si transcurrido ese tiempo no finalizas el pago, los productos volverán a estar disponibles para otros clientes.
                </p>
              </div>
            </section>

            {/* 3. Precios e Impuestos */}
            <section id="precios" className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-7 shadow-xs">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
                3. Precios e Impuestos
              </h2>
              <div className="space-y-2.5 text-sm text-gray-600 leading-relaxed">
                <p>
                  Todos los precios de los productos se encuentran en pesos colombianos (COP) e incluyen los impuestos de ley correspondientes (como el IVA).
                </p>
                <p>
                  Antes de autorizar cualquier cobro, siempre verás en pantalla el resumen detallado con el subtotal de tus artículos, los impuestos aplicados, el valor del envío y el total final a pagar, sin cargos ocultos.
                </p>
              </div>
            </section>

            {/* 4. Envíos y Entregas */}
            <section id="envios" className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-7 shadow-xs">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
                4. Envíos y Entregas
              </h2>
              <div className="space-y-2.5 text-sm text-gray-600 leading-relaxed">
                <p>
                  Realizamos entregas en Medellín y los municipios del área metropolitana. El costo del envío se calcula con base en la dirección de entrega que indiques al momento de comprar.
                </p>
                <p>
                  Para compras que alcancen el monto mínimo establecido en la tienda, el costo de envío será totalmente gratis. Al momento de recibir tu paquete, te recomendamos verificar que el empaque se encuentre en perfecto estado.
                </p>
              </div>
            </section>

            {/* 5. Pagos Seguros */}
            <section id="pagos" className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-7 shadow-xs">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
                5. Pagos Seguros
              </h2>
              <div className="space-y-2.5 text-sm text-gray-600 leading-relaxed">
                <p>
                  Aceptamos pagos con tarjeta de crédito mediante plataformas de pago seguras y certificadas.
                </p>
                <p>
                  Por tu seguridad, nuestra tienda nunca guarda el número completo de tu tarjeta ni el código de seguridad. La información viaja protegida y encriptada directamente hacia la entidad financiera correspondiente.
                </p>
              </div>
            </section>

            {/* 6. Cambios, Devoluciones y Garantías */}
            <section id="garantias" className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-7 shadow-xs">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
                6. Cambios, Devoluciones y Garantías
              </h2>
              <div className="space-y-2.5 text-sm text-gray-600 leading-relaxed">
                <p>
                  Respaldamos la calidad de todos nuestros productos:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-gray-600">
                  <li>
                    <strong>Garantía:</strong> Si recibes un producto con algún defecto o daño de fábrica, gestionamos el cambio o la devolución correspondiente.
                  </li>
                  <li>
                    <strong>Derecho de Retracto:</strong> Tienes derecho a retractarte de tu compra dentro de los 5 días hábiles siguientes a la entrega, siempre y cuando el producto conserve su empaque original y no presente señales de uso.
                  </li>
                </ul>
              </div>
            </section>

            {/* 7. Privacidad y Protección de Datos */}
            <section id="privacidad" className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-7 shadow-xs">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
                7. Privacidad y Protección de Datos
              </h2>
              <div className="space-y-2.5 text-sm text-gray-600 leading-relaxed">
                <p>
                  Respetamos tu privacidad. Tus datos de contacto (nombre, correo, teléfono y dirección) son utilizados exclusivamente para gestionar tu pedido, coordinar la entrega y enviarte el comprobante de compra.
                </p>
                <p>
                  No compartimos ni vendemos tu información personal a terceros con fines publicitarios.
                </p>
              </div>
            </section>

            {/* 8. Atención al Cliente */}
            <section id="contacto" className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-7 shadow-xs">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
                8. Atención al Cliente
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                Si tienes alguna duda sobre tu compra, tu envío o requieres asistencia, estamos a tu disposición:
              </p>
              <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 text-xs sm:text-sm space-y-1.5 text-gray-700">
                <p>
                  <span className="font-semibold text-gray-900">Correo de atención:</span> contacto@jhzshop.com
                </p>
                <p>
                  <span className="font-semibold text-gray-900">Ciudad:</span> Medellín, Colombia
                </p>
                <p>
                  <span className="font-semibold text-gray-900">Horario:</span> Lunes a Viernes de 8:00 a.m. a 6:00 p.m.
                </p>
              </div>
            </section>

            {/* Botones inferiores */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/checkout')}
                className="btn-primary py-3 text-sm font-bold flex-1 text-center"
              >
                Volver al Proceso de Compra
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="btn-secondary py-3 text-sm font-bold flex-1 text-center"
              >
                Ver Catálogo de Productos
              </button>
            </div>
          </article>
        </div>
      </main>

      {/* Pie de página simple */}
      <footer className="mt-12 bg-white border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        <p>© 2026 JhzShop. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};
