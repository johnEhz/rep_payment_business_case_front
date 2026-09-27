import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ordersApi } from '../../api/orders.api';
import { Order } from '../../types';
import { formatCOP } from '../../utils/currency';
import { AppHeader } from '../../components/AppHeader';

export const TrackPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedOrder, setCopiedOrder] = useState<boolean>(false);

  useEffect(() => {
    if (!orderNumber || !token) {
      setError('El número de orden y el token de acceso son requeridos para consultar el estado del pedido.');
      setIsLoading(false);
      return;
    }

    ordersApi
      .track(orderNumber, token)
      .then((data) => {
        setOrder(data);
        setError(null);
      })
      .catch((err: any) => {
        const msg =
          err.response?.data?.message ||
          'No se encontró la orden o el enlace de acceso ya no es válido.';
        setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [orderNumber, token]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    toast.success('Enlace de seguimiento copiado al portapapeles');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyOrderNumber = () => {
    if (!order) return;
    navigator.clipboard.writeText(order.orderNumber);
    setCopiedOrder(true);
    toast.success(`Número de orden ${order.orderNumber} copiado`);
    setTimeout(() => setCopiedOrder(false), 2500);
  };

  const formatDate = (date?: string | null) => {
    if (!date) return 'Pendiente';
    return new Date(date).toLocaleString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Pantalla de Carga (Responsive Skeleton)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <AppHeader showBack={true} />
        <div className="flex-1 flex flex-col justify-center items-center px-4 py-12">
          <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
            <h2 className="text-lg font-bold text-gray-900">Rastreando pedido...</h2>
            <p className="text-sm text-gray-500 mt-1">
              Consultando estado en tiempo real para #{orderNumber}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de Error
  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <AppHeader showBack={true} />
        <div className="flex-1 flex flex-col justify-center items-center px-4 py-12">
          <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              !
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Orden no disponible</h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              {error || 'El enlace no es válido o ha expirado.'}
            </p>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-4 rounded-xl text-sm transition-all shadow-sm"
            >
              Volver a la Tienda
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Configuración de Estado y Timeline
  let statusBadge = {
    label: 'Pendiente de Pago',
    bg: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
    step: 1,
  };

  if (order.status === 'PAID') {
    statusBadge = {
      label: 'En Preparación / Despacho',
      bg: 'bg-blue-50 text-blue-800 border-blue-200',
      dot: 'bg-blue-500',
      step: 2,
    };
  } else if (order.status === 'DELIVERED') {
    statusBadge = {
      label: 'Entregado con Éxito',
      bg: 'bg-green-50 text-green-800 border-green-200',
      dot: 'bg-green-500',
      step: 4,
    };
  } else if (order.status === 'CANCELLED') {
    statusBadge = {
      label: 'Orden Cancelada',
      bg: 'bg-red-50 text-red-800 border-red-200',
      dot: 'bg-red-500',
      step: 0,
    };
  } else if (order.status === 'EXPIRED') {
    statusBadge = {
      label: 'Plazo Expirado',
      bg: 'bg-gray-100 text-gray-700 border-gray-200',
      dot: 'bg-gray-400',
      step: 0,
    };
  }

  const timelineSteps = [
    {
      id: 1,
      title: 'Pedido Registrado',
      desc: formatDate(order.createdAt),
      active: statusBadge.step >= 1,
      completed: statusBadge.step > 1,
      icon: (
        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: 2,
      title: 'Pago Confirmado',
      desc: order.paidAt ? formatDate(order.paidAt) : 'Esperando confirmación',
      active: statusBadge.step >= 2,
      completed: statusBadge.step > 2,
      icon: (
        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 3,
      title: 'En Camino',
      desc: order.deliveryCity ? `Hacia ${order.deliveryCity}` : 'En centro de despacho',
      active: statusBadge.step >= 3,
      completed: statusBadge.step > 3,
      icon: (
        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
      ),
    },
    {
      id: 4,
      title: 'Entregado',
      desc: order.deliveredAt ? formatDate(order.deliveredAt) : 'Pendiente de entrega',
      active: statusBadge.step >= 4,
      completed: statusBadge.step >= 4,
      icon: (
        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24 lg:pb-12 print:pb-0 print:bg-white text-gray-900 antialiased">
      {/* Header Estándar de la Aplicación */}
      <AppHeader showBack={true} />

      {/* Sub-barra de acciones rápidas (visible en desktop y móvil) */}
      <div className="bg-white border-b border-gray-200/80 px-4 sm:px-6 lg:px-8 py-3 print:hidden shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 hidden sm:inline">Rastreo en Línea:</span>
            <span className="font-mono text-xs font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md">
              #{order.orderNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              title="Copiar enlace de seguimiento"
              className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg active:scale-95 transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>{copiedLink ? '¡Enlace Copiado!' : 'Compartir'}</span>
            </button>

            <button
              onClick={() => window.print()}
              title="Imprimir comprobante"
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg active:scale-95 transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Imprimir</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contenedor Principal Responsive (Mobile-First y adaptado a Desktop) */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ══════════════════════════════════════════════════════════
              COLUMNA IZQUIERDA / PRINCIPAL (Móvil: 100%, Desktop: 7 cols)
              ══════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-5">
            
            {/* Tarjeta de Resumen y Estado */}
            <section className="bg-white rounded-2xl border border-gray-200/90 shadow-sm p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                    Número de Orden
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                      #{order.orderNumber}
                    </span>
                    <button
                      onClick={handleCopyOrderNumber}
                      title="Copiar número"
                      className="p-1 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    {copiedOrder && (
                      <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded">
                        Copiado
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 mt-1 block">
                    Creado el {formatDate(order.createdAt)}
                  </span>
                </div>

                <div className="self-start sm:self-center">
                  <div className={`px-3 py-1.5 rounded-full border text-xs font-bold tracking-tight inline-flex items-center gap-2 ${statusBadge.bg}`}>
                    <span className={`w-2 h-2 rounded-full ${statusBadge.dot} animate-pulse`} />
                    <span>{statusBadge.label}</span>
                  </div>
                </div>
              </div>

              {/* Banner dinámico de estado */}
              {order.status === 'DELIVERED' ? (
                <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 text-emerald-900 text-xs sm:text-sm">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-emerald-950">¡Paquete Entregado con Éxito!</p>
                    <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                      Tu pedido fue entregado el {formatDate(order.deliveredAt)} en la dirección indicada. ¡Esperamos que disfrutes tu compra!
                    </p>
                  </div>
                </div>
              ) : order.status === 'PAID' ? (
                <div className="bg-blue-50/90 border border-blue-200 rounded-xl p-4 flex items-start gap-3 text-blue-900 text-xs sm:text-sm">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-blue-950">Pago Aprobado y En Despacho</p>
                    <p className="text-xs text-blue-800 mt-0.5 leading-relaxed">
                      La transacción ha sido validada. Nuestro centro logístico se encuentra preparando tu pedido para el transporte.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-900 text-xs sm:text-sm">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-amber-950">Pendiente de Pago</p>
                    <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                      La orden está registrada. Recuerda completar el pago para confirmar tu compra y reservar el inventario.
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* Línea de Tiempo del Pedido (Responsive: Stepper en Desktop, Vertical en Mobile) */}
            <section className="bg-white rounded-2xl border border-gray-200/90 shadow-sm p-5">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-5">
                Seguimiento y Estados del Pedido
              </h2>

              {/* Vista Desktop / Tablet (Stepper Horizontal) */}
              <div className="hidden md:grid grid-cols-4 gap-2 relative">
                {/* Barra de progreso de fondo */}
                <div className="absolute top-5 left-8 right-8 h-1 bg-gray-200 -z-0" />
                <div
                  className="absolute top-5 left-8 h-1 bg-emerald-500 transition-all duration-500 -z-0"
                  style={{
                    width:
                      statusBadge.step >= 4
                        ? 'calc(100% - 4rem)'
                        : statusBadge.step === 3
                        ? '66%'
                        : statusBadge.step === 2
                        ? '33%'
                        : '0%',
                  }}
                />

                {timelineSteps.map((s, idx) => (
                  <div key={s.id} className="relative z-10 flex flex-col items-center text-center px-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                        s.completed
                          ? 'bg-emerald-600 text-white shadow-md'
                          : s.active
                          ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-md'
                          : 'bg-white border-2 border-gray-300 text-gray-400'
                      }`}
                    >
                      {s.completed ? '✓' : s.icon}
                    </div>

                    <div className="mt-3">
                      <p className={`text-xs font-bold ${s.active ? 'text-gray-900' : 'text-gray-400'}`}>
                        {s.title}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">
                        {s.desc}
                      </p>
                      {s.active && idx + 1 === statusBadge.step && (
                        <span className="inline-block mt-1 text-[9px] bg-blue-50 text-blue-700 font-extrabold px-1.5 py-0.5 rounded uppercase">
                          Estado Actual
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Vista Mobile (Timeline Vertical optimizada para pantallas pequeñas) */}
              <div className="md:hidden relative pl-6 space-y-5">
                <div className="absolute left-[11px] top-2 bottom-3 w-0.5 bg-gray-200 -z-0" />

                {timelineSteps.map((s, idx) => (
                  <div key={s.id} className="relative flex items-start gap-3 z-10">
                    <div
                      className={`-ml-6 w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] transition-all flex-shrink-0 ${
                        s.completed
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : s.active
                          ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-sm'
                          : 'bg-white border-2 border-gray-300 text-gray-400'
                      }`}
                    >
                      {s.completed ? '✓' : idx + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs font-bold ${s.active ? 'text-gray-900' : 'text-gray-400'}`}>
                          {s.title}
                        </p>
                        {s.active && idx + 1 === statusBadge.step && (
                          <span className="text-[10px] text-blue-600 font-semibold uppercase">
                            Actual
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Productos Comprados */}
            <section className="bg-white rounded-2xl border border-gray-200/90 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Artículos del Pedido
                </h3>
                <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {order.items?.length || 0} producto(s)
                </span>
              </div>

              <div className="divide-y divide-gray-100">
                {order.items?.map((it) => (
                  <div key={it.productId} className="py-3 flex items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {it.imageUrl ? (
                        <img
                          src={it.imageUrl}
                          alt={it.productName}
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border border-gray-100 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {it.productName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-sm sm:text-base truncate">
                          {it.productName}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500 mt-0.5">
                          <span>
                            Cantidad: <strong className="text-gray-800">{it.quantity}</strong>
                          </span>
                          <span>·</span>
                          <span>Unitario: {formatCOP(it.unitPrice)}</span>
                          {it.taxRate ? (
                            <>
                              <span>·</span>
                              <span className="text-[11px] text-gray-400">IVA ({it.taxRate}%)</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="font-mono font-bold text-gray-900 text-right flex-shrink-0 text-sm sm:text-base">
                      {formatCOP(it.totalAmount)}
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>

          {/* ══════════════════════════════════════════════════════════
              COLUMNA DERECHA / SIDEBAR (Móvil: 100%, Desktop: 5 cols sticky)
              ══════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-5 lg:sticky lg:top-20">
            
            {/* Liquidación de Totales */}
            <section className="bg-white rounded-2xl border border-gray-200/90 shadow-sm p-5">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
                Resumen Financiero
              </h3>

              <div className="space-y-2.5 text-xs sm:text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal productos:</span>
                  <span className="font-mono text-gray-900">{formatCOP(order.subtotalAmount)}</span>
                </div>

                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Descuento aplicado:</span>
                    <span className="font-mono font-semibold">-{formatCOP(order.discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-600">
                  <span>Envío a domicilio:</span>
                  <span className="font-mono font-semibold text-emerald-600">
                    {Number(order.deliveryFeeAmount) === 0 ? 'Gratis' : formatCOP(order.deliveryFeeAmount)}
                  </span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>IVA liquidado (19%):</span>
                  <span className="font-mono text-gray-900">{formatCOP(order.taxAmount)}</span>
                </div>

                <div className="pt-3 border-t border-gray-200 flex justify-between items-baseline">
                  <span className="text-sm sm:text-base font-extrabold text-gray-900">Total:</span>
                  <span className="font-mono text-lg sm:text-xl font-black text-blue-600">
                    {formatCOP(order.totalAmount)}
                  </span>
                </div>
              </div>
            </section>

            {/* Datos de Entrega y Destinatario */}
            <section className="bg-white rounded-2xl border border-gray-200/90 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Destinatario y Envío
                </h3>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-gray-50">
                  <span className="text-gray-500">Recibe:</span>
                  <span className="font-bold text-gray-900 text-right">{order.customerName}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-50">
                  <span className="text-gray-500">Teléfono:</span>
                  <a
                    href={`tel:${order.customerPhone}`}
                    className="font-semibold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <span>{order.customerPhone}</span>
                    <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </a>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-50">
                  <span className="text-gray-500">Email:</span>
                  <span className="font-medium text-gray-800 break-all text-right max-w-[200px]">
                    {order.customerEmail}
                  </span>
                </div>
                <div className="pt-1">
                  <span className="text-gray-500 block mb-0.5">Dirección de Entrega:</span>
                  <p className="font-semibold text-gray-900 leading-snug">
                    {order.deliveryAddress}
                    {order.deliveryNeighborhood ? `, B. ${order.deliveryNeighborhood}` : ''}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {order.deliveryCity}, {order.deliveryDepartment || 'Antioquia'}, {order.deliveryCountry || 'Colombia'}
                  </p>
                </div>
              </div>
            </section>

            {/* Detalles de Pago */}
            <section className="bg-white rounded-2xl border border-gray-200/90 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Comprobante Financiero
                </h3>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-gray-50">
                  <span className="text-gray-500">Referencia:</span>
                  <span className="font-mono font-bold text-gray-900 text-[11px] break-all text-right max-w-[210px]">
                    {order.transaction?.reference || order.orderNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-50">
                  <span className="text-gray-500">Método de pago:</span>
                  <span className="font-medium text-gray-900">
                    {order.transaction?.paymentMethod === 'CARD' ? 'Tarjeta de Crédito / Débito' : order.transaction?.paymentMethod || 'Tarjeta'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-50">
                  <span className="text-gray-500">Cuotas diferidas:</span>
                  <span className="font-medium text-gray-900">{order.transaction?.installments || 1} cuota(s)</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-500">Confirmación:</span>
                  <span className="font-medium text-gray-900 text-right">{formatDate(order.paidAt)}</span>
                </div>
              </div>
            </section>

            {/* Botones de Acción Desktop (Ocultos en móvil, se muestran en la barra fija inferior en mobile) */}
            <div className="hidden lg:flex flex-col gap-2.5 print:hidden">
              <button
                onClick={() => navigate('/')}
                className="w-full bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
              >
                <span>Seguir Comprando</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => window.print()}
                className="w-full bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Imprimir Comprobante</span>
              </button>
            </div>

            {/* Asistencia */}
            <p className="text-xs text-center text-gray-400 py-1">
              ¿Preguntas sobre tu paquete? Escríbenos a{' '}
              <a href="mailto:soporte@jhzshop.com" className="text-blue-600 underline font-medium">
                soporte@jhzshop.com
              </a>
            </p>

          </div>
        </div>
      </main>

      {/* ══════════════════════════════════════════════════════════
          BOTONERA FLOTANTE INFERIOR EXCLUSIVA PARA DISPOSITIVOS MÓVILES
          (Oculta en pantallas Desktop 'lg:hidden' para optimizar espacio)
          ══════════════════════════════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 p-3 z-30 lg:hidden print:hidden shadow-lg">
        <div className="max-w-md mx-auto flex gap-2.5">
          <button
            onClick={() => window.print()}
            className="flex-1 bg-white hover:bg-gray-50 active:scale-95 border border-gray-300 text-gray-700 font-bold py-3 px-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Imprimir</span>
          </button>

          <button
            onClick={() => navigate('/')}
            className="flex-[2] bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5"
          >
            <span>Seguir Comprando</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
