import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  setCustomerInfo,
  setCardInfo,
  setStep,
  fetchMerchantData,
  fetchCheckoutPreview,
  clearPreviewError,
} from '../../store/slices/checkoutSlice';
import { createGuestOrder, setCurrentOrder } from '../../store/slices/orderSlice';
import {
  selectCartItems,
  selectCartSubtotal,
  updateQuantity,
  removeItem,
} from '../../store/slices/cartSlice';
import { fetchProducts } from '../../store/slices/catalogSlice';
import { AppHeader } from '../../components/AppHeader';
import { CustomSelect } from '../../components/ui/Select';
import { PhoneInput } from '../../components/ui/PhoneInput';
import { CreditCardModal } from '../../components/CreditCardModal';
import {
  deliveryInfoSchema,
  DeliveryInfoFormValues,
  CreditCardModalFormValues,
  buildFormattedAddress,
} from '../../utils/validators';
import { formatCOP } from '../../utils/currency';
import { locationsApi } from '../../api/locations.api';
import { ordersApi } from '../../api/orders.api';
import { Country, Department, City, Order } from '../../types';
import { Skeleton } from '../../components/ui/Skeleton';
import { MapboxLocationModal, SelectedLocationData } from '../../components/MapboxLocationModal';

export const CheckoutPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const cartItems = useAppSelector(selectCartItems);
  const subtotal = useAppSelector(selectCartSubtotal);
  const { customerInfo, merchantData, preview, previewLoading, previewError, stockError } =
    useAppSelector((s) => s.checkout);
  const { creating } = useAppSelector((s) => s.order);

  // Geographic catalogs from backend
  const [countries, setCountries] = useState<Country[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  // State for active pending order recovery
  const [activePendingOrder, setActivePendingOrder] = useState<Order | null>(null);
  const [activeOrderSeconds, setActiveOrderSeconds] = useState<number>(0);

  // State to control Credit Card Modal and Mapbox Modal
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [selectedMapCoords, setSelectedMapCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [validatedDeliveryData, setValidatedDeliveryData] =
    useState<DeliveryInfoFormValues | null>(null);

  // Guard: redirect if cart empty
  useEffect(() => {
    if (cartItems.length === 0) {
      toast.info('Tu carrito está vacío. Agrega productos para continuar.');
      navigate('/');
    }
  }, [cartItems, navigate]);

  // Load merchant data for gateway terms permalink & public key
  useEffect(() => {
    if (!merchantData) {
      dispatch(fetchMerchantData());
    }
  }, [dispatch, merchantData]);

  // Load geographic catalogs
  useEffect(() => {
    locationsApi.getCountries().then(setCountries).catch(() => {});
    locationsApi.getDepartments('CO').then(setDepartments).catch(() => {});
    locationsApi.getCities('ANT').then(setCities).catch(() => {});
  }, []);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<DeliveryInfoFormValues>({
    resolver: zodResolver(deliveryInfoSchema),
    mode: 'onChange',
    defaultValues: {
      name: customerInfo?.name ?? '',
      email: customerInfo?.email ?? '',
      phone: customerInfo?.phone ?? '',
      phoneExtension: customerInfo?.phoneExtension ?? '+57',
      country: customerInfo?.country ?? 'Colombia',
      department: customerInfo?.department ?? 'Antioquia',
      city: customerInfo?.city ?? 'Medellín',
      address: customerInfo?.address ?? '',
      complement: customerInfo?.complement ?? '',
      neighborhood: customerInfo?.neighborhood ?? '',
      notes: customerInfo?.notes ?? '',
    },
  });

  const watchedCity = watch('city');
  const watchedDepartment = watch('department');
  const watchedCountry = watch('country');
  const watchedAddress = watch('address');
  const watchedNeighborhood = watch('neighborhood');

  // Helper to immediately execute preview of current cart/order
  const executeOrderPreview = useCallback(() => {
    if (cartItems.length === 0) return;
    dispatch(
      fetchCheckoutPreview({
        items: cartItems.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        deliveryCity: watchedCity || 'Medellín',
        deliveryDepartment: watchedDepartment || 'Antioquia',
        deliveryCountry: watchedCountry || 'Colombia',
        deliveryAddress: watchedAddress?.trim() || undefined,
        deliveryNeighborhood: watchedNeighborhood?.trim() || undefined,
        deliveryLatitude: selectedMapCoords?.lat,
        deliveryLongitude: selectedMapCoords?.lng,
      })
    );
  }, [
    cartItems,
    watchedCity,
    watchedDepartment,
    watchedCountry,
    watchedAddress,
    watchedNeighborhood,
    selectedMapCoords,
    dispatch,
  ]);

  // Load active pending order associated with current checkout session
  useEffect(() => {
    let isMounted = true;
    ordersApi
      .getActiveOrder()
      .then((data) => {
        if (!isMounted) return;
        if (data.hasActiveOrder && data.order) {
          if (data.order.status !== 'PENDING_PAYMENT' || (data.remainingSeconds !== undefined && data.remainingSeconds <= 0)) {
            setActivePendingOrder(null);
            return;
          }
          setActivePendingOrder(data.order);
          setActiveOrderSeconds(data.remainingSeconds || 0);

          // Si el formulario aún no tiene datos, precargar con la información de la orden activa
          if (!customerInfo?.name && data.order.customerName) {
            setValue('name', data.order.customerName, { shouldValidate: true });
            setValue('email', data.order.customerEmail, { shouldValidate: true });
            setValue('phone', data.order.customerPhone, { shouldValidate: true });
            if (data.order.customerPhoneExtension) {
              setValue('phoneExtension', data.order.customerPhoneExtension);
            }
            if (data.order.deliveryAddress) {
              setValue('address', data.order.deliveryAddress, { shouldValidate: true });
            }
            if (data.order.deliveryNeighborhood) {
              setValue('neighborhood', data.order.deliveryNeighborhood, { shouldValidate: true });
            }
            if (data.order.deliveryCity) {
              setValue('city', data.order.deliveryCity, { shouldValidate: true });
            }
            if (data.order.deliveryLatitude && data.order.deliveryLongitude) {
              setSelectedMapCoords({
                lat: Number(data.order.deliveryLatitude),
                lng: Number(data.order.deliveryLongitude),
              });
            }
          }
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [setValue, customerInfo?.name]);

  // Temporizador para la reserva de inventario de la orden activa
  useEffect(() => {
    if (!activePendingOrder || activeOrderSeconds <= 0) return;
    const interval = setInterval(() => {
      setActiveOrderSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setActivePendingOrder(null);
          toast.warning('Tu orden pendiente ha expirado y la reserva de inventario fue liberada');
          dispatch(clearPreviewError());
          executeOrderPreview();
          dispatch(fetchProducts());
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activePendingOrder, activeOrderSeconds, executeOrderPreview, dispatch]);

  const handleResumeExistingOrder = () => {
    if (!activePendingOrder) return;
    dispatch(setCurrentOrder(activePendingOrder));
    dispatch(setStep(3));
    navigate('/summary');
  };

  const handleDiscardAndCreateNew = async () => {
    try {
      await ordersApi.cancelActiveOrder();
      setActivePendingOrder(null);
      toast.success('Orden anterior cancelada');
      dispatch(clearPreviewError());
      executeOrderPreview();
      dispatch(fetchProducts());
    } catch {
      setActivePendingOrder(null);
      dispatch(clearPreviewError());
      executeOrderPreview();
      dispatch(fetchProducts());
    }
  };

  const handleUpdateQty = (
    productId: string,
    newQty: number,
    maxStock?: number,
    productName?: string
  ) => {
    if (newQty <= 0) {
      handleRemoveProduct(productId, productName);
      return;
    }
    if (maxStock !== undefined && newQty > maxStock) {
      toast.warning(
        `Solo hay ${maxStock} unidades disponibles de "${productName || 'este producto'}"`
      );
      return;
    }
    dispatch(clearPreviewError());
    dispatch(updateQuantity({ productId, quantity: newQty }));
  };

  const handleRemoveProduct = (productId: string, productName?: string) => {
    dispatch(clearPreviewError());
    dispatch(removeItem(productId));
    toast.info(`"${productName || 'Producto'}" eliminado de la orden`);
  };

  const hasFormErrors = Object.keys(errors).length > 0;
  const isFormValid = isValid && !hasFormErrors;
  const isButtonDisabled =
    !isFormValid || Boolean(previewError) || previewLoading || cartItems.length === 0;

  const handleMapLocationSelected = (loc: SelectedLocationData) => {
    setSelectedMapCoords({ lat: loc.latitude, lng: loc.longitude });
    setValue('address', loc.address, { shouldValidate: true, shouldDirty: true });
    if (loc.neighborhood) {
      setValue('neighborhood', loc.neighborhood, { shouldValidate: true, shouldDirty: true });
    }
    if (loc.city) {
      setValue('city', loc.city, { shouldValidate: true, shouldDirty: true });
    }
    if (loc.department) {
      setValue('department', loc.department, { shouldValidate: true, shouldDirty: true });
    }
    if (loc.country) {
      setValue('country', loc.country, { shouldValidate: true, shouldDirty: true });
    }
  };

  // Real-time dynamic shipping & fee calculation as user defines delivery location
  useEffect(() => {
    if (cartItems.length === 0) return;

    const timer = setTimeout(() => {
      executeOrderPreview();
    }, 350);

    return () => clearTimeout(timer);
  }, [executeOrderPreview, cartItems.length]);

  // Reactively alert user whenever stock or preview issues arise
  useEffect(() => {
    if (previewError) {
      toast.warning(previewError, { id: 'preview-stock-error', duration: 4000 });
    }
  }, [previewError]);

  /**
   * Action: "Pay with credit card" button
   * Validates the delivery & buyer information on the page.
   * If valid, opens the CreditCardModal to request card info.
   */
  const handleOpenCardModal = (data: DeliveryInfoFormValues) => {
    if (previewError) {
      toast.error(previewError, { id: 'preview-stock-error' });
      return;
    }
    if (previewLoading) {
      return;
    }
    setValidatedDeliveryData(data);
    setIsCardModalOpen(true);
  };

  /**
   * Action triggered inside CreditCardModal after card data is validated.
   * Creates the order in the backend (reserving stock) and transitions to Step 3.
   */
  const handleCompleteOrderWithCard = async (cardData: CreditCardModalFormValues) => {
    if (!validatedDeliveryData) return;

    const formattedAddress = buildFormattedAddress(
      validatedDeliveryData.address,
      validatedDeliveryData.complement
    );

    // Save customer info in Redux
    dispatch(
      setCustomerInfo({
        name: validatedDeliveryData.name,
        email: validatedDeliveryData.email,
        phone: validatedDeliveryData.phone,
        phoneExtension: validatedDeliveryData.phoneExtension,
        address: validatedDeliveryData.address,
        complement: validatedDeliveryData.complement || undefined,
        neighborhood: validatedDeliveryData.neighborhood,
        city: validatedDeliveryData.city,
        department: validatedDeliveryData.department,
        country: validatedDeliveryData.country,
        notes: validatedDeliveryData.notes || undefined,
      })
    );

    // Save card info in memory ONLY (never persisted in localStorage)
    dispatch(
      setCardInfo({
        number: cardData.cardNumber.replace(/\s/g, ''),
        cardHolder: cardData.cardHolder,
        expMonth: cardData.expMonth,
        expYear: cardData.expYear,
        cvc: cardData.cvc,
        installments: cardData.installments,
      })
    );

    // Create the order on backend: Order is created with reserved stock; payment transaction remains pending
    const orderResult = await dispatch(
      createGuestOrder({
        items: cartItems.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        customerName: validatedDeliveryData.name,
        customerEmail: validatedDeliveryData.email,
        customerPhone: validatedDeliveryData.phone,
        customerPhoneExtension: validatedDeliveryData.phoneExtension,
        deliveryAddress: formattedAddress,
        deliveryNeighborhood: validatedDeliveryData.neighborhood,
        deliveryCity: validatedDeliveryData.city,
        deliveryDepartment: validatedDeliveryData.department,
        deliveryCountry: validatedDeliveryData.country,
        deliveryLatitude: selectedMapCoords?.lat,
        deliveryLongitude: selectedMapCoords?.lng,
        deliveryNotes: validatedDeliveryData.notes || undefined,
        termsAccepted: cardData.termsAccepted,
        termsPermalink: merchantData?.permalink || `${window.location.origin}/terms`,
        acceptanceToken: merchantData?.acceptanceToken,
      })
    );

    if (createGuestOrder.rejected.match(orderResult)) {
      const errMsg = (orderResult.payload as string) || 'Error al generar la orden';
      toast.error('No se pudo generar la orden', { description: errMsg });
      return;
    }

    setIsCardModalOpen(false);

    toast.success('Orden generada con éxito', {
      description: 'Inventario apartado por 15 minutos. Revisa tu resumen antes de pagar.',
    });

    dispatch(setStep(3));
    navigate('/summary');
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AppHeader currentStep={2} showBack onBack={handleBack} />

      <main className="flex-1 max-w-6xl mx-auto px-2.5 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8 w-full pb-32 lg:pb-12">
        <div className="mb-4 sm:mb-5">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Información de Entrega y Pago
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            Diligencia tus datos de despacho y selecciona el método de pago con tarjeta de crédito.
          </p>
        </div>

        {/* Banner de orden pendiente activa con reserva de inventario */}
        {activePendingOrder && (
          <div className="card border-primary-200 bg-primary-50/70 p-4 sm:p-5 mb-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
              <div>
                <span className="inline-block text-[11px] font-bold text-primary-800 bg-primary-100 px-2 py-0.5 rounded-md uppercase tracking-wider mb-1">
                  Orden en curso
                </span>
                <h3 className="text-sm sm:text-base font-bold text-gray-900">
                  Tienes una orden reservada (#{activePendingOrder.orderNumber})
                </h3>
                <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                  Tu inventario está apartado por los próximos{' '}
                  <span className="font-bold text-primary-700 font-mono">
                    {Math.floor(activeOrderSeconds / 60)}:
                    {(activeOrderSeconds % 60).toString().padStart(2, '0')} min
                  </span>
                  . Puedes continuar directamente con esta orden o descartarla para crear una nueva.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handleResumeExistingOrder}
                  className="btn-primary py-2.5 px-4 text-xs w-auto font-bold shadow-xs whitespace-nowrap"
                >
                  Continuar con esta orden
                </button>
                <button
                  type="button"
                  onClick={handleDiscardAndCreateNew}
                  className="text-xs text-gray-500 hover:text-red-600 underline font-medium cursor-pointer whitespace-nowrap"
                >
                  Descartar orden
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(handleOpenCardModal)} noValidate>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">
            {/* Left Column: Delivery & Buyer Info Forms (order-2 on mobile, order-1 on desktop) */}
            <div className="order-2 lg:order-1 lg:col-span-7 space-y-4 sm:space-y-5">
              {/* 1. Información personal */}
              <div className="card p-3.5 sm:p-6">
                <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-gray-100">
                  <span className="w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <h2 className="text-base font-bold text-gray-900">
                    Datos del comprador
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5"
                    >
                      Nombre completo *
                    </label>
                    <input
                      id="name"
                      type="text"
                      autoComplete="name"
                      placeholder="Ej: Juan Pérez García"
                      className={`input-field ${errors.name ? 'error' : ''}`}
                      {...register('name')}
                    />
                    {errors.name && <p className="error-text">{errors.name.message}</p>}
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5"
                    >
                      Correo electrónico *
                    </label>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="juan.perez@example.com"
                      className={`input-field ${errors.email ? 'error' : ''}`}
                      {...register('email')}
                    />
                    {errors.email && <p className="error-text">{errors.email.message}</p>}
                  </div>

                  {/* Teléfono con Extensión seleccionable a la izquierda */}
                  <Controller
                    name="phoneExtension"
                    control={control}
                    render={({ field: extField }) => (
                      <Controller
                        name="phone"
                        control={control}
                        render={({ field: phoneField }) => (
                          <PhoneInput
                            id="phone"
                            label="Teléfono / Celular *"
                            phoneExtension={extField.value || '+57'}
                            onExtensionChange={extField.onChange}
                            phoneNumber={phoneField.value || ''}
                            onPhoneChange={phoneField.onChange}
                            phoneError={errors.phone?.message}
                          />
                        )}
                      />
                    )}
                  />
                </div>
              </div>

              {/* 2. Dirección de entrega y catálogos geográficos */}
              <div className="card p-3.5 sm:p-6">
                <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-gray-100">
                  <span className="w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <h2 className="text-base font-bold text-gray-900">
                    Dirección de entrega
                  </h2>
                </div>

                <div className="space-y-4">
                  {/* Selectores de catálogo: País, Departamento, Ciudad */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Controller
                      name="country"
                      control={control}
                      render={({ field }) => (
                        <CustomSelect
                          id="country"
                          label="País *"
                          options={
                            countries.length > 0
                              ? countries.map((c) => ({ value: c.name, label: c.name }))
                              : [{ value: 'Colombia', label: 'Colombia' }]
                          }
                          value={field.value}
                          onChange={field.onChange}
                          error={errors.country?.message}
                        />
                      )}
                    />

                    <Controller
                      name="department"
                      control={control}
                      render={({ field }) => (
                        <CustomSelect
                          id="department"
                          label="Departamento *"
                          options={
                            departments.length > 0
                              ? departments.map((d) => ({ value: d.name, label: d.name }))
                              : [{ value: 'Antioquia', label: 'Antioquia' }]
                          }
                          value={field.value}
                          onChange={field.onChange}
                          error={errors.department?.message}
                        />
                      )}
                    />

                    <Controller
                      name="city"
                      control={control}
                      render={({ field }) => (
                        <CustomSelect
                          id="city"
                          label="Ciudad / Municipio *"
                          options={
                            cities.length > 0
                              ? cities.map((ci) => ({ value: ci.name, label: ci.name }))
                              : [{ value: 'Medellín', label: 'Medellín' }]
                          }
                          value={field.value}
                          onChange={field.onChange}
                          error={errors.city?.message}
                        />
                      )}
                    />
                  </div>

                  {/* Campo de dirección principal */}
                  <div>
                    <label
                      htmlFor="address"
                      className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5"
                    >
                      Dirección principal *
                    </label>
                    <input
                      id="address"
                      type="text"
                      placeholder="Ej: Carrera 80B # 75-171 o Calle 10 # 40-20"
                      className={`input-field ${errors.address ? 'error' : ''}`}
                      {...register('address')}
                    />
                    {errors.address && (
                      <p className="error-text">{errors.address.message}</p>
                    )}

                    <div className="mt-2 flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => setIsMapModalOpen(true)}
                        className="text-xs text-primary-600 hover:text-primary-800 underline decoration-primary-300 underline-offset-2 transition-colors cursor-pointer font-medium"
                      >
                        {selectedMapCoords
                          ? 'Modificar dirección en el mapa'
                          : 'Seleccionar dirección en el mapa'}
                      </button>
                    </div>
                  </div>

                  {/* Campo de complemento */}
                  <div>
                    <label
                      htmlFor="complement"
                      className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5"
                    >
                      Complemento (opcional)
                    </label>
                    <input
                      id="complement"
                      type="text"
                      placeholder="Ej: Apto 301, Torre 2, Interior 5, Casa 12"
                      className={`input-field ${errors.complement ? 'error' : ''}`}
                      {...register('complement')}
                    />
                    {errors.complement && (
                      <p className="error-text">{errors.complement.message}</p>
                    )}
                  </div>

                  {/* Barrio o Sector */}
                  <div>
                    <label
                      htmlFor="neighborhood"
                      className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5"
                    >
                      Barrio o sector *
                    </label>
                    <input
                      id="neighborhood"
                      type="text"
                      placeholder="Ej: Robledo, El Poblado, Laureles, Belén..."
                      className={`input-field ${errors.neighborhood ? 'error' : ''}`}
                      {...register('neighborhood')}
                    />
                    {errors.neighborhood && (
                      <p className="error-text">{errors.neighborhood.message}</p>
                    )}
                  </div>

                  {/* Notas de entrega */}
                  <div>
                    <label
                      htmlFor="notes"
                      className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5"
                    >
                      Instrucciones especiales para el repartidor (opcional)
                    </label>
                    <textarea
                      id="notes"
                      placeholder="Ej: Dejar en portería, avisar por citófono..."
                      rows={2}
                      className="input-field resize-none text-sm"
                      {...register('notes')}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary & Action (order-1 on mobile, order-2 on desktop) */}
            <div className="order-1 lg:order-2 lg:col-span-5 space-y-4">
              <div className="card p-3.5 sm:p-5 sticky top-24">
                <h2 className="text-sm font-bold text-gray-900 pb-3 mb-3 border-b border-gray-100 flex items-center justify-between uppercase tracking-wider">
                  <span>Resumen de tu orden</span>
                  <span className="text-xs text-gray-500 font-normal lowercase">
                    {cartItems.reduce((acc, i) => acc + i.quantity, 0)} productos
                  </span>
                </h2>

                {/* Items preview list with inline stepper and remove action */}
                <div className="space-y-2.5 mb-4 max-h-72 overflow-y-auto pr-1">
                  {cartItems.map((item) => {
                    const imgUrl = item.product.imageUrl || item.product.images?.[0];
                    const isOverStock = item.quantity > item.product.stock;
                    const hasStockIssue =
                      isOverStock ||
                      stockError?.productId === item.productId ||
                      (Boolean(stockError?.productName) &&
                        item.product.name.toLowerCase().includes((stockError?.productName || '').toLowerCase()));

                    return (
                      <div
                        key={item.productId}
                        className={`flex items-center gap-3 p-2 rounded-xl transition-all ${
                          hasStockIssue
                            ? 'bg-amber-50/40 border border-amber-200/70'
                            : 'bg-white border border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        {/* Product Thumbnail */}
                        <div className="w-12 h-12 bg-gray-50 rounded-xl overflow-hidden shrink-0 border border-gray-100 flex items-center justify-center">
                          {imgUrl ? (
                            <img
                              src={imgUrl}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  'https://placehold.co/100x100/f3f4f6/9ca3af?text=Img';
                              }}
                            />
                          ) : (
                            <span className="text-[10px] font-mono text-gray-400 font-bold">ITEM</span>
                          )}
                        </div>

                        {/* Product details & Stepper */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <p className="font-medium text-gray-900 truncate text-xs sm:text-sm">
                              {item.product.name}
                            </p>
                            <span className="font-semibold text-xs sm:text-sm text-gray-900 shrink-0 tabular-nums">
                              {formatCOP(item.product.priceInCents * item.quantity)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2 mt-1.5">
                            {/* Stepper controls */}
                            <div className="flex items-center gap-1.5">
                              <div className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50/60 p-0.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateQty(
                                      item.productId,
                                      item.quantity - 1,
                                      item.product.stock,
                                      item.product.name
                                    )
                                  }
                                  disabled={item.quantity <= 1}
                                  aria-label="Disminuir cantidad"
                                  className="w-5 h-5 rounded flex items-center justify-center text-gray-600 hover:bg-white hover:text-gray-900 transition-colors font-bold text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  −
                                </button>
                                <span className="text-xs font-semibold text-gray-800 min-w-[1.25rem] text-center tabular-nums px-0.5">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateQty(
                                      item.productId,
                                      item.quantity + 1,
                                      item.product.stock,
                                      item.product.name
                                    )
                                  }
                                  disabled={item.quantity >= item.product.stock}
                                  aria-label="Aumentar cantidad"
                                  className="w-5 h-5 rounded flex items-center justify-center text-gray-600 hover:bg-white hover:text-gray-900 transition-colors font-bold text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  +
                                </button>
                              </div>

                              {/* Remove item button */}
                              <button
                                type="button"
                                onClick={() => handleRemoveProduct(item.productId, item.product.name)}
                                aria-label="Eliminar producto"
                                title="Eliminar de la orden"
                                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <svg
                                  className="w-3.5 h-3.5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth="1.75"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>

                            {/* Subtle Non-invasive Stock Badges */}
                            {hasStockIssue ? (
                              <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200/60 font-medium px-1.5 py-0.5 rounded shrink-0">
                                {item.product.stock === 0 ? 'Agotado' : `Máx. ${item.product.stock} disp.`}
                              </span>
                            ) : item.quantity === item.product.stock ? (
                              <span className="text-[10px] text-gray-500 bg-gray-100/70 border border-gray-200/50 font-medium px-1.5 py-0.5 rounded shrink-0">
                                Máx. alcanzado
                              </span>
                            ) : (
                              <span className="text-[11px] text-gray-400 shrink-0">
                                {formatCOP(item.product.priceInCents)} c/u
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reactive Stock / Preview Notice - Clean & Non-invasive */}
                {previewError && (
                  <div className="mb-3 rounded-xl border border-amber-200/80 bg-amber-50/70 p-2.5 text-xs text-amber-900 shadow-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <p className="text-[11px] sm:text-xs text-amber-800 leading-snug flex-1">
                        {previewError}
                      </p>
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-100 pt-3.5 space-y-2 mb-4 text-xs sm:text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal base (sin IVA)</span>
                    <span className="font-semibold text-gray-900">
                      {preview ? formatCOP(preview.subtotalAmount) : formatCOP(Math.round(subtotal / 1.19))}
                    </span>
                  </div>

                  <div className="flex justify-between text-gray-600">
                    <span>IVA (19%)</span>
                    <span className="font-semibold text-gray-900">
                      {preview ? formatCOP(preview.taxAmount) : formatCOP(subtotal - Math.round(subtotal / 1.19))}
                    </span>
                  </div>

                  <div className="flex justify-between text-gray-600">
                    <span>Tarifa de servicio (Fee)</span>
                    <span className="font-semibold text-gray-900">
                      {formatCOP(preview?.feeAmount ?? 300000)}
                    </span>
                  </div>

                  <div className="flex justify-between text-gray-600 items-center">
                    <span>Costo de envío</span>
                    <span className="font-semibold text-gray-900">
                      {previewLoading ? (
                        <Skeleton className="h-4 w-20 rounded" />
                      ) : preview ? (
                        preview.deliveryFeeAmount === 0 ? (
                          <span className="text-green-600 font-bold">¡Envío Gratis!</span>
                        ) : (
                          formatCOP(preview.deliveryFeeAmount)
                        )
                      ) : (
                        <span className="text-gray-400 text-xs">Al ingresar destino</span>
                      )}
                    </span>
                  </div>

                  {/* Total Estimado */}
                  <div className="border-t border-gray-100 pt-3 mt-2 flex justify-between items-baseline">
                    <div>
                      <span className="text-sm font-bold text-gray-900 block">Total a pagar</span>
                      <span className="text-[10px] text-gray-400">Impuestos y flete incluidos</span>
                    </div>
                    <span className="text-lg sm:text-xl font-black text-primary-700">
                      {previewLoading ? (
                        <Skeleton className="h-7 w-28 rounded-lg" />
                      ) : (
                        formatCOP(preview?.totalAmount ?? subtotal + 300000)
                      )}
                    </span>
                  </div>
                </div>

                {/* Desktop Action button: "Pay with credit card" */}
                <div className="hidden lg:block pt-2">
                  <button
                    type="submit"
                    disabled={isButtonDisabled}
                    className="btn-primary w-full py-3.5 text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {!isFormValid
                      ? 'Completa los datos de entrega'
                      : previewError
                      ? 'Ajusta las cantidades para pagar'
                      : 'Pay with credit card'}
                  </button>

                  <p className="text-center text-[11px] text-gray-400 mt-2.5 leading-relaxed">
                    {!isFormValid
                      ? 'Diligencia correctamente todos los campos obligatorios (*) para habilitar el pago.'
                      : previewError
                      ? 'Ajusta las unidades en el resumen superior para continuar con el pago.'
                      : 'Al pulsar el botón se abrirá el formulario seguro para ingresar tu tarjeta de crédito y reservar tu inventario.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Full-Width Fixed Bottom Bar for Action */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-3 z-40 shadow-2xl">
            {previewError ? (
              <p className="text-center text-xs font-medium text-amber-700 mb-1.5 truncate">
                {previewError}
              </p>
            ) : !isFormValid ? (
              <p className="text-center text-xs text-amber-600 mb-1.5 truncate font-medium">
                Completa los datos de entrega para habilitar el pago
              </p>
            ) : null}
            <button
              type="submit"
              disabled={isButtonDisabled}
              className="btn-primary w-full py-3.5 flex items-center justify-center font-bold text-sm shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {!isFormValid
                ? 'Completa los datos de entrega'
                : previewError
                ? 'Ajusta las cantidades para pagar'
                : 'Pay with credit card'}
            </button>
          </div>
        </form>

        {/* Modal for Credit Card input with live brand detection (VISA / MasterCard) */}
        <CreditCardModal
          isOpen={isCardModalOpen}
          onClose={() => setIsCardModalOpen(false)}
          onSubmit={handleCompleteOrderWithCard}
          isSubmitting={creating}
          merchantPermalink={merchantData?.permalink}
        />

        {/* Modal for Mapbox Interactive Map Location Selection */}
        <MapboxLocationModal
          isOpen={isMapModalOpen}
          onClose={() => setIsMapModalOpen(false)}
          onSelectLocation={handleMapLocationSelected}
          initialCoords={
            selectedMapCoords
              ? { latitude: selectedMapCoords.lat, longitude: selectedMapCoords.lng }
              : undefined
          }
        />
      </main>
    </div>
  );
};
