import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

import { supabase } from './supabase.js';
import { useEffect } from 'react';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password
      });

    if (error) {
      setError(error.message);
    } else {
      onLogin(data.session);
    }

    setLoading(false);
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      background: '#101827',
      padding: 20
    }}>
      <form onSubmit={handleLogin} style={{
        background: '#ffffff',
        padding: 30,
        borderRadius: 20,
        width: '100%',
        maxWidth: 380
      }}>
        <h1 style={{ color: '#172554' }}>
          Sabor Divino
        </h1>
        <p style={{ color: '#555' }}>
          Iniciar sesión
        </p>

        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ width: '100%', padding: 12, marginBottom: 12 }}
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{ width: '100%', padding: 12, marginBottom: 12 }}
        />

        {error && (
          <p style={{ color: 'red' }}>{error}</p>
        )}

        <button type="submit" disabled={loading} style={{
          width: '100%',
          padding: 14,
          background: '#2563eb',
          color: 'white',
          border: 0,
          borderRadius: 10
        }}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

import './register-sw.js';

const initialArticles = [
  { id: 1, name: 'Harina (ejemplo)', unit: 'lb', stock: 0, minimum: 5 },
  { id: 2, name: 'Aceite (ejemplo)', unit: 'litros', stock: 0, minimum: 3 },
];
const nav = [
  { id: 'inicio', icon: '⌂', label: 'Inicio' },
  { id: 'inventario', icon: '▦', label: 'Inventario' },
  { id: 'compras', icon: '＋', label: 'Compras' },
  { id: 'pagos', icon: '$', label: 'Pagos' },
  { id: 'ventas', icon: '↗', label: 'Ventas' },
  { id: 'articulos', icon: '□', label: 'Artículos' },
  { id: 'menu', icon: '♨', label: 'Menú y recetas' },
  { id: 'proveedores', icon: '♧', label: 'Proveedores' },
  { id: 'reportes', icon: '▤', label: 'Reportes PDF' },
  { id: 'usuarios', icon: '♙', label: 'Usuarios' },
];
function App() {
  
  const [session, setSession] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCheckingAuth(false);
    });

    const { data: listener } =
      supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
      });

    return () => listener.subscription.unsubscribe();
  }, []);

  const [section, setSection] = useState('inicio');
  const [articles, setArticles] = useState([]);
const [loadingArticles, setLoadingArticles] = useState(true);
  useEffect(() => {
  if (!session) {
    setArticles([]);
    setLoadingArticles(false);
    return;
  }

  let active = true;

  async function cargarArticulos() {
    setLoadingArticles(true);

    const { data, error } = await supabase
      .from('articulos')
      .select('id, nombre, unidad, stock_actual, stock_minimo')
      .order('nombre');

    if (!active) return;

    if (error) {
      console.error('Error cargando artículos:', error);
      setToast('Error al cargar artículos desde Supabase.');
    } else {
      setArticles(
        data.map(a => ({
          id: a.id,
          name: a.nombre,
          unit: a.unidad,
          stock: Number(a.stock_actual || 0),
          minimum: Number(a.stock_minimo || 0)
        }))
      );
    }

    setLoadingArticles(false);
  }

  cargarArticulos();

  return () => {
    active = false;
  };
}, [session]);
  const [purchases, setPurchases] = useState([]);
  
useEffect(() => {
  if (!session) {
    setPurchases([]);
    return;
  }

  let active = true;

  async function cargarCompras() {
    const { data, error } = await supabase
      .from('compras')
      .select(`
        id,
        articulo_id,
        cantidad,
        precio_original,
        tipo_impuesto,
        tasa_impuesto,
        monto_impuesto,
        total,
        fecha,
        proveedor_id,
        articulos(nombre)
      `)
      .order('fecha', { ascending: false });

    if (!active) return;

    if (error) {
      console.error('Error cargando compras:', error);
      flash('No se pudieron cargar las compras.');
      return;
    }

    setPurchases((data || []).map(p => ({
      id: p.id,
      article: p.articulos?.nombre || 'Artículo no disponible',
      quantity: Number(p.cantidad),
      price: Number(p.precio_original),
      tax: Number(p.monto_impuesto || 0),
      total: Number(p.total || 0),
      date: p.fecha,
      taxRate: Number(p.tasa_impuesto || 0),
      taxMode: p.tipo_impuesto
    })));
  }

  cargarCompras();

  return () => {
    active = false;
  };
}, [session]);

  const [payments, setPayments] = useState([]);
  useEffect(() => {
  if (!session) {
    setPayments([]);
    return;
  }

  async function cargarPagos() {
    const { data, error } = await supabase
      .from('pagos')
      .select('id, motivo_id, descripcion, monto, fecha')
      .order('fecha', { ascending: false });

    if (error) {
      console.error('Error cargando pagos:', error);
      return;
    }

    setPayments(data.map(p => ({
      id: p.id,
      reason: p.motivo_id,
      description: p.descripcion,
      amount: Number(p.monto),
      date: p.fecha
    })));
  }

  cargarPagos();
}, [session]);
  const [dishes, setDishes] = useState([]);
  
useEffect(() => {
  if (!session) {
    setDishes([]);
    return;
  }

  let active = true;

  async function cargarMenu() {
    const { data, error } = await supabase
      .from('menu')
      .select('id, nombre, precio')
      .order('nombre');

    if (!active) return;

    if (error) {
      console.error('Error cargando menú:', error);
      flash('Error al cargar el menú.');
      return;
    }

    setDishes((data || []).map(plato => ({
      id: plato.id,
      name: plato.nombre,
      price: Number(plato.precio || 0),
      recipe: []
    })));
  }

  cargarMenu();

  return () => {
    active = false;
  };
}, [session]);

  const [suppliers, setSuppliers] = useState([]);
  useEffect(() => {
  if (!session) {
    setSuppliers([]);
    return;
  }

  async function cargarProveedores() {
    if (!session) return;
    const { data, error } = await supabase
      .from('proveedores')
      .select('id, nombre')
      .order('nombre');

    if (error) {
  console.error('Error cargando proveedores:', error);
  flash('Error proveedores: ' + error.message);
  return;
}

    setSuppliers(
      (data || []).map(p => ({
        id: p.id,
        name: p.nombre
      }))
    );
  }

  cargarProveedores();
}, [session]);
  const [users, setUsers] = useState([{id:1,name:'Administrador principal',role:'Administrador'}]);
  const [toast, setToast] = useState('');
  const [articleForm, setArticleForm] = useState({ name:'', unit:'lb', minimum:'0' });
  const [supplierForm, setSupplierForm] = useState('');
  const [userForm, setUserForm] = useState({ name:'', role:'Usuario simple' });
  const [purchaseForm, setPurchaseForm] = useState({ article:'', quantity:'', date:new Date().toISOString().slice(0,10), price:'', supplier:'', buyer:'', taxMode:'no', taxRate:'0' });
  const [paymentForm, setPaymentForm] = useState({ reason:'', description:'', date:new Date().toISOString().slice(0,10), amount:'' });
  const [dishForm, setDishForm] = useState({ name:'', price:'' });
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0,10));
  const [sales, setSales] = useState({});
  useEffect(() => {
  if (!session) {
    setSales({});
    return;
  }

  async function cargarVentas() {
    const { data, error } = await supabase
      .from('ventas')
      .select('fecha, total')
      .eq('origen', 'manual')
      .order('fecha', { ascending: false });

    if (error) {
      console.error('Error cargando ventas:', error);
      return;
    }

    console.log('Ventas recuperadas:', data);
  }

  cargarVentas();
}, [session]);
  const [search, setSearch] = useState('');
  const [mobileNav, setMobileNav] = useState(false);
  const [role, setRole] = useState('Administrador');
  const flash = (msg) => { setToast(msg); window.setTimeout(() => setToast(''), 3000); };
  
async function persistArticles(next) {
  const nuevos = next.filter(a => !articles.some(actual => actual.id === a.id));

  if (nuevos.length !== 1 || next.length !== articles.length + 1) {
    flash('Esta operación todavía no está conectada a Supabase.');
    return;
  }

  const articulo = nuevos[0];

  const { data, error } = await supabase
    .from('articulos')
    .insert({
      nombre: articulo.name,
      unidad: articulo.unit,
      stock_actual: Number(articulo.stock || 0),
      stock_minimo: Number(articulo.minimum || 0)
    })
    .select('id, nombre, unidad, stock_actual, stock_minimo')
    .single();

  if (error) {
    console.error(error);
    flash('No se pudo guardar el artículo en Supabase.');
    return;
  }

  setArticles(prev => [...prev, {
    id: data.id,
    name: data.nombre,
    unit: data.unidad,
    stock: Number(data.stock_actual || 0),
    minimum: Number(data.stock_minimo || 0)
  }]);

  flash('Artículo guardado en Supabase.');
}

  const stockRows = useMemo(() => articles.map(a => ({...a, stock: Number(a.stock || 0) + purchases.filter(p=>p.article===a.name).reduce((s,p)=>s+Number(p.quantity||0),0)})), [articles,purchases]);
  const totalSales = Object.values(sales).reduce((sum, row) => sum + (row.qty * row.price), 0);
  const totalPurchases = purchases.reduce((s,p)=>s + p.total,0);
  const title = nav.find(n=>n.id===section)?.label || 'Inicio';
  
async function addArticle(e) {
  e.preventDefault();

  if (!articleForm.name.trim()) return;

  await persistArticles([
    ...articles,
    {
      id: crypto.randomUUID(),
      name: articleForm.name.trim(),
      unit: articleForm.unit,
      stock: 0,
      minimum: Number(articleForm.minimum) || 0
    }
  ]);

  setArticleForm({
    name: '',
    unit: 'lb',
    minimum: '0'
  });
}

  
async function addPurchase(e) {
  e.preventDefault();

  if (
    !purchaseForm.article ||
    !purchaseForm.quantity ||
    !purchaseForm.price
  ) return;

  const articulo = articles.find(
    a => a.name === purchaseForm.article
  );

  if (!articulo) {
    flash('No se encontró el artículo en Supabase.');
    return;
  }

  const cantidad = Number(purchaseForm.quantity);
  const base = Number(purchaseForm.price);
  const rate = Number(purchaseForm.taxRate) || 0;

  if (
    !Number.isFinite(cantidad) ||
    cantidad <= 0 ||
    !Number.isFinite(base) ||
    base < 0 ||
    rate < 0
  ) {
    flash('Revisa la cantidad, precio e impuesto.');
    return;
  }

  let tax = 0;
  let total = base;

  if (purchaseForm.taxMode === 'extra') {
    tax = base * rate / 100;
    total = base + tax;
  } else if (purchaseForm.taxMode === 'included') {
    tax = base - base / (1 + rate / 100);
  }

  const tipoImpuesto = {
    no: 'sin_impuesto',
    extra: 'sin_incluir',
    included: 'incluido'
  }[purchaseForm.taxMode];

  const { data: usuarioData } =
    await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('compras')
    .insert({
      articulo_id: articulo.id,
      cantidad,
      precio_original: base,
      tipo_impuesto: tipoImpuesto,
      tasa_impuesto: rate,
      monto_impuesto: tax,
      total,
      fecha: purchaseForm.date,
      registrado_por: usuarioData?.user?.id ?? null
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error guardando compra:', error);
    flash('No se pudo guardar la compra: ' + error.message);
    return;
  }

  setPurchases(prev => [
    ...prev,
    {
      ...purchaseForm,
      id: data.id,
      quantity: cantidad,
      price: base,
      tax,
      total
    }
  ]);

  setPurchaseForm(prev => ({
    ...prev,
    quantity: '',
    price: ''
  }));

  flash('Compra guardada en Supabase.');
}



  
async function addPayment(e) {
  e.preventDefault();

  if (!paymentForm.reason || !paymentForm.amount) return;
  
const nombreMotivo = paymentForm.reason.trim();

let { data: motivo, error: motivoError } = await supabase
  .from('motivos_pago')
  .select('id')
  .ilike('nombre', nombreMotivo)
  .maybeSingle();

if (!motivo && !motivoError) {
  const resultado = await supabase
    .from('motivos_pago')
    .insert({ nombre: nombreMotivo })
    .select('id')
    .single();

  motivo = resultado.data;
  motivoError = resultado.error;
}


if (motivoError) {
  flash('No se encontró el motivo del pago.');
  return;
}

  const { data, error } = await supabase
    .from('pagos')
    .insert({
      motivo_id: motivo.id,
      descripcion: paymentForm.description || '',
      monto: Number(paymentForm.amount),
      fecha: new Date().toLocaleDateString('en-CA'),
      registrado_por: session.user.id
    })
    .select('id, motivo_id, descripcion, monto, fecha')
    .single();

  if (error) {
    console.error(error);
    flash('Error al guardar pago: ' + error.message);
    return;
  }

  setPayments(prev => [...prev, {
    id: data.id,
    reason: data.motivo_id,
    description: data.descripcion,
    amount: Number(data.monto),
    date: data.fecha
  }]);

  setPaymentForm(prev => ({
    ...prev,
    amount: '',
    description: ''
  }));

  flash('Pago guardado en Supabase.');
}

  
async function addDish(e) {
  e.preventDefault();

  const nombre = dishForm.name.trim();
  if (!nombre) return;

  const { data, error } = await supabase
    .from('menu')
    .insert({
      nombre: nombre,
      precio: Number(dishForm.price) || 0,
      disponible: true
    })
    .select('id, nombre, precio')
    .single();

  if (error) {
    console.error(error);
    flash('Error al guardar plato: ' + error.message);
    return;
  }

  setDishes(prev => [...prev, {
    id: data.id,
    name: data.nombre,
    price: Number(data.precio),
    recipe: []
  }]);

  setDishForm({ name: '', price: '' });
  flash('Plato guardado en Supabase.');
}

  async function addSupplier(e) {
  e.preventDefault();

  const nombre = supplierForm.trim();
  if (!nombre) return;

  const { data, error } = await supabase
    .from('proveedores')
    .insert({ nombre })
    .select('id, nombre')
    .single();

  if (error) {
    console.error(error);
    flash('Error al guardar proveedor: ' + error.message);
    return;
  }

  setSuppliers(prev => [...prev, {
    id: data.id,
    name: data.nombre
  }]);

  setSupplierForm('');
  flash('Proveedor guardado en Supabase.');
}
  function addUser(e) { e.preventDefault(); if(!userForm.name.trim())return; setUsers([...users,{id:Date.now(),...userForm}]); setUserForm({name:'',role:'Usuario simple'}); flash('Usuario de demostración añadido. El acceso real requiere Supabase.'); }
  
async function saveSales(e) {
  e.preventDefault();

  const total = Number(sales[saleDate] || 0);

  if (!Number.isFinite(total) || total < 0) {
    flash('Introduce un total válido.');
    return;
  }

  const { error } = await supabase
    .from('ventas')
    .insert({
      fecha: saleDate,
      origen: 'manual',
      total,
      registrado_por: session.user.id
    });

  if (error) {
    console.error('Error guardando venta:', error);
    flash('Error al guardar venta: ' + error.message);
    return;
  }

  flash('Venta guardada en Supabase.');
}

  function downloadCsv() { const rows=[['Artículo','Unidad','Existencias','Mínimo'],...stockRows.map(a=>[a.name,a.unit,a.stock,a.minimum])]; const csv=rows.map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\n'); const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'})); const a=document.createElement('a'); a.href=url; a.download='sabor-divino-inventario.csv'; a.click(); URL.revokeObjectURL(url); }
  
if (checkingAuth) {
  return <div>Verificando sesión...</div>;
}

if (!session) {
  return <Login onLogin={setSession} />;
}

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav?'open':''}`}>
      <div className="brand"><img src="/logo-sabor-divino.jpeg" alt="Logo Sabor Divino"/><div><strong>Sabor Divino</strong><span>Servicio Exprés</span></div><button className="close-nav" onClick={()=>setMobileNav(false)}>×</button></div>
      <div className="workspace-label">GESTIÓN DEL NEGOCIO</div>
      <nav>{nav.map(item=><button key={item.id} className={`nav-item ${section===item.id?'active':''}`} onClick={()=>{setSection(item.id);setMobileNav(false)}}><span className="nav-icon">{item.icon}</span><span>{item.label}</span>{item.id==='usuarios'&&<span className="admin-tag">ADMIN</span>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="cloud-dot"></div><div><b>Modo de demostración</b><small>Sin conexión a la nube aún</small></div></div>
    </aside>
    {mobileNav && <button className="scrim" aria-label="Cerrar menú" onClick={()=>setMobileNav(false)} />}
    <main className="main-area">
      <header className="topbar"><button className="menu-toggle" onClick={()=>setMobileNav(true)}>☰</button><div className="crumb">Sabor Divino <span>/</span> <b>{title}</b></div><div className="top-actions"><button
  type="button"
  onClick={async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert('Error al cerrar sesión: ' + error.message);
    } else {
      setSession(null);
    }
  }}
>
  Cerrar sesión
</button><span className="status-pill"><i></i> Vista previa</span><div className="avatar">{role==='Administrador'?'AD':'US'}</div><select aria-label="Vista de rol" value={role} onChange={e=>setRole(e.target.value)}><option>Administrador</option><option>Usuario simple</option></select></div></header>
      <div className="content">
        <div className="page-heading"><div><div className="eyebrow">SABOR DIVINO · SERVICIO EXPRÉS</div><h1>{section==='inicio'?'Buenos días 👋':title}</h1><p>{section==='inicio'?'Aquí tienes el resumen de la operación de tu negocio.':'Administra la información de tu negocio desde un solo lugar.'}</p></div><div className="today">{new Date().toLocaleDateString('es-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'})}</div></div>
        {section==='inicio' && <>
          <div className="welcome-banner"><div><span className="banner-kicker">PANEL DE CONTROL</span><h2>Todo tu negocio,<br/>en un solo lugar.</h2><p>Controla el inventario, registra compras y mantén las ventas organizadas.</p><button className="gold-button" onClick={()=>setSection('inventario')}>Ver inventario <span>→</span></button></div><div className="banner-mark">SD<span>✦</span></div></div>
          <div className="section-row"><h2>Resumen del negocio</h2><span className="muted">Datos de esta vista de prueba</span></div>
          <div className="stats-grid"><Stat icon="▦" label="Artículos" value={articles.length} note="Registrados en este navegador"/><Stat icon="＋" label="Compras" value={money(totalPurchases)} note={`${purchases.length} registros de compra`}/><Stat icon="↗" label="Ventas del día" value={money(totalSales)} note="Importación Square pendiente"/><Stat icon="$" label="Pagos" value={money(payments.reduce((s,p)=>s+p.amount,0))} note={`${payments.length} pagos registrados`}/></div>
          <div className="dashboard-grid"><div className="panel"><div className="panel-heading"><div><h3>Accesos rápidos</h3><p>Las tareas más comunes</p></div></div><div className="quick-grid"><Quick icon="＋" title="Registrar compra" desc="Añadir mercancía" onClick={()=>setSection('compras')}/><Quick icon="▦" title="Revisar inventario" desc="Ver existencias" onClick={()=>setSection('inventario')}/><Quick icon="↗" title="Registrar ventas" desc="Ventas por día" onClick={()=>setSection('ventas')}/><Quick icon="▤" title="Generar reporte" desc="Exportar información" onClick={()=>setSection('reportes')}/></div></div><div className="panel activity-panel"><div className="panel-heading"><div><h3>Estado del sistema</h3><p>Preparación de la versión completa</p></div><span className="status-pill amber">En construcción</span></div><div className="check-row"><span className="check-icon">✓</span><div><b>Identidad visual configurada</b><small>Logo y colores de la marca</small></div></div><div className="check-row"><span className="check-icon">✓</span><div><b>Interfaz adaptable</b><small>Diseño para móvil y escritorio</small></div></div><div className="check-row"><span className="pending-icon">○</span><div><b>Supabase y permisos reales</b><small>Pendiente de configuración</small></div></div><div className="check-row"><span className="pending-icon">○</span><div><b>Integración automática con Square</b><small>Pendiente de credenciales y pruebas</small></div></div></div></div>
          <div className="notice"><span>i</span><p><b>Importante:</b> esta es la primera versión visual. Los registros, usuarios y ventas aún no se comparten entre teléfonos. Conectaremos Supabase antes de usarla con datos reales del negocio.</p></div>
        </>}
        {section==='inventario' && <><div className="stats-grid compact"><Stat icon="▦" label="Artículos" value={articles.length} note="Catálogo"/><Stat icon="!" label="Por revisar" value={stockRows.filter(a=>a.stock<=a.minimum).length} note="En o bajo el mínimo"/></div><div className="panel"><div className="panel-heading"><div><h3>Existencias actuales</h3><p>Las cantidades reales se calcularán con compras, ventas y recetas.</p></div><button className="outline-button" onClick={downloadCsv}>↓ Exportar CSV</button></div><ArticleTable rows={stockRows} search={search} setSearch={setSearch}/></div></>}
        {section==='articulos' && <div className="two-col"><div className="panel"><div className="panel-heading"><div><h3>Nuevo artículo</h3><p>Registra ingredientes y suministros.</p></div></div><form className="form-grid" onSubmit={addArticle}><Field label="Nombre del artículo"><input required value={articleForm.name} onChange={e=>setArticleForm({...articleForm,name:e.target.value})} placeholder="Ej. Arroz"/></Field><Field label="Unidad de medida"><select value={articleForm.unit} onChange={e=>setArticleForm({...articleForm,unit:e.target.value})}>{['lb','oz','gramos','kg','piezas','litros','ml','cajas','paquetes','galones'].map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Existencia mínima"><input type="number" min="0" step="any" value={articleForm.minimum} onChange={e=>setArticleForm({...articleForm,minimum:e.target.value})}/></Field><button className="primary-button full" type="submit">＋ Añadir artículo</button></form></div><div className="panel"><div className="panel-heading"><div><h3>Artículos registrados</h3><p>{articles.length} en este navegador</p></div></div><ArticleTable rows={stockRows} search={search} setSearch={setSearch} onDelete={id=>persistArticles(articles.filter(a=>a.id!==id))}/></div></div>}
        {section==='compras' && <div className="two-col"><div className="panel"><div className="panel-heading"><div><h3>Registrar compra</h3><p>Introduce los datos de la factura o recibo.</p></div></div><form className="form-grid" onSubmit={addPurchase}><Field label="Artículo"><select required value={purchaseForm.article} onChange={e=>setPurchaseForm({...purchaseForm,article:e.target.value})}><option value="">Selecciona un artículo</option>{articles.map(a=><option key={a.id}>{a.name}</option>)}</select></Field><div className="field-pair"><Field label="Cantidad"><input required type="number" min="0.001" step="any" value={purchaseForm.quantity} onChange={e=>setPurchaseForm({...purchaseForm,quantity:e.target.value})}/></Field><Field label="Precio ($)"><input required type="number" min="0" step="0.01" value={purchaseForm.price} onChange={e=>setPurchaseForm({...purchaseForm,price:e.target.value})}/></Field></div><Field label="Fecha"><input type="date" value={purchaseForm.date} onChange={e=>setPurchaseForm({...purchaseForm,date:e.target.value})}/></Field><Field label="Proveedor"><select value={purchaseForm.supplier} onChange={e=>setPurchaseForm({...purchaseForm,supplier:e.target.value})}><option value="">Selecciona proveedor</option>{suppliers.map(s=><option key={s.id}>{s.name}</option>)}</select></Field><Field label="Comprador"><input value={purchaseForm.buyer} onChange={e=>setPurchaseForm({...purchaseForm,buyer:e.target.value})} placeholder="Quién hizo la compra"/></Field><Field label="Impuestos"><select value={purchaseForm.taxMode} onChange={e=>setPurchaseForm({...purchaseForm,taxMode:e.target.value})}><option value="no">Sin impuestos</option><option value="included">Precio incluye impuesto</option><option value="extra">Añadir impuesto al precio</option></select></Field>{purchaseForm.taxMode!=='no'&&<Field label="Tasa de impuesto (%)"><input type="number" min="0" step="any" value={purchaseForm.taxRate} onChange={e=>setPurchaseForm({...purchaseForm,taxRate:e.target.value})}/></Field>}<button className="primary-button full" type="submit">Guardar compra de prueba</button></form></div><div className="panel"><div className="panel-heading"><div><h3>Compras recientes</h3><p>Ordenadas por fecha</p></div></div><div className="table-wrap"><table><thead><tr><th>Fecha</th><th>Artículo</th><th>Cant.</th><th>Total</th></tr></thead><tbody>{[...purchases].sort((a,b)=>b.date.localeCompare(a.date)).map(p=><tr key={p.id}><td>{p.date}</td><td>{p.article}</td><td>{p.quantity}</td><td>{money(p.total)}</td></tr>)}</tbody></table>{!purchases.length&&<Empty text="Todavía no hay compras en esta sesión."/>}</div></div></div>}
        {section==='pagos' && <div className="two-col"><div className="panel"><div className="panel-heading"><div><h3>Registrar pago</h3><p>Guarda un gasto o pago del negocio.</p></div></div><form className="form-grid" onSubmit={addPayment}><Field label="Motivo del pago"><select required value={paymentForm.reason} onChange={e=>setPaymentForm({...paymentForm,reason:e.target.value})}><option value="">Selecciona motivo</option>{['Renta','Servicios','Nómina','Transporte','Mantenimiento','Suministros','Otro'].map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Descripción"><input value={paymentForm.description} onChange={e=>setPaymentForm({...paymentForm,description:e.target.value})} placeholder="Detalles opcionales"/></Field><Field label="Fecha"><input type="date" value={paymentForm.date} onChange={e=>setPaymentForm({...paymentForm,date:e.target.value})}/></Field><Field label="Importe ($)"><input required type="number" min="0" step="0.01" value={paymentForm.amount} onChange={e=>setPaymentForm({...paymentForm,amount:e.target.value})}/></Field><button className="primary-button full" type="submit">Guardar pago de prueba</button></form></div><div className="panel"><div className="panel-heading"><div><h3>Pagos recientes</h3><p>{payments.length} registros de esta sesión</p></div></div><div className="simple-list">{payments.map(p=><div className="list-line" key={p.id}><div><b>{p.reason}</b><small>{p.date} · {p.description}</small></div><strong>{money(p.amount)}</strong></div>)}{!payments.length&&<Empty text="Todavía no hay pagos registrados."/>}</div></div></div>}
        {section==='ventas' && <div className="panel"><div className="panel-heading"><div><h3>Ventas por día</h3><p>Cuando conectemos Square, importaremos las ventas automáticamente cada noche.</p></div><span className="status-pill amber">Square sin conectar</span></div><Field label="Día de ventas"><input type="date" value={saleDate} onChange={e=>setSaleDate(e.target.value)}/></Field><div className="table-wrap top-space"><table><thead><tr><th>Plato</th><th>Precio</th><th>Cantidad vendida</th><th>Total</th></tr></thead><tbody>{dishes.map(d=><tr key={d.id}><td>{d.name}</td><td>{money(d.price)}</td><td><input className="qty-input" type="number" min="0" value={sales[d.id]?.qty||0} onChange={e=>setSales({...sales,[d.id]:{qty:Number(e.target.value),price:d.price,date:saleDate}})}/></td><td>{money((sales[d.id]?.qty||0)*d.price)}</td></tr>)}</tbody></table>{!dishes.length&&<Empty text="Primero añade los platos desde la sección Menú y recetas."/>}</div><div className="table-footer"><span>Total de ventas mostradas</span><strong>{money(dishes.reduce((s,d)=>s+(sales[d.id]?.qty||0)*d.price,0))}</strong></div><button className="primary-button" onClick={saveSales}>Guardar ventas en Supabase</button></div>}
        {section==='menu' && <div className="two-col"><div className="panel"><div className="panel-heading"><div><h3>Añadir plato</h3><p>El menú contiene platos y sus recetas.</p></div></div><form className="form-grid" onSubmit={addDish}><Field label="Nombre del plato"><input required value={dishForm.name} onChange={e=>setDishForm({...dishForm,name:e.target.value})} placeholder="Ej. Pabellón criollo"/></Field><Field label="Precio de venta ($)"><input type="number" min="0" step="0.01" value={dishForm.price} onChange={e=>setDishForm({...dishForm,price:e.target.value})} required/></Field><button className="primary-button full" type="submit">＋ Añadir plato</button></form><div className="notice inline-notice"><span>i</span><p>El editor de recetas para asignar ingredientes y cantidades se completará en la siguiente fase.</p></div></div><div className="panel"><div className="panel-heading"><div><h3>Menú</h3><p>{dishes.length} platos añadidos</p></div></div><div className="simple-list">{dishes.map(d=><div className="list-line" key={d.id}><div><b>{d.name}</b><small>Receta pendiente de configurar</small></div><strong>{money(d.price)}</strong></div>)}{!dishes.length&&<Empty text="Todavía no hay platos. Tú podrás cargarlos desde aquí."/>}</div></div></div>}
        {section==='proveedores' && <div className="two-col"><div className="panel"><div className="panel-heading"><div><h3>Nuevo proveedor</h3><p>Guarda tus proveedores habituales.</p></div></div><form className="form-grid" onSubmit={addSupplier}><Field label="Nombre del proveedor"><input required value={supplierForm} onChange={e=>setSupplierForm(e.target.value)} placeholder="Nombre comercial"/></Field><button className="primary-button full">＋ Añadir proveedor</button></form></div><div className="panel"><div className="panel-heading"><div><h3>Proveedores</h3><p>{suppliers.length} registrados en esta sesión</p></div></div><div className="simple-list">{suppliers.map(s=><div className="list-line" key={s.id}><b>{s.name}</b><button className="text-button" onClick={()=>setSuppliers(suppliers.filter(x=>x.id!==s.id))}>Eliminar</button></div>)}{!suppliers.length&&<Empty text="Aquí aparecerán los proveedores que añadas."/>}</div></div></div>}
        {section==='usuarios' && <div className="two-col"><div className="panel"><div className="panel-heading"><div><h3>Crear usuario</h3><p>Selecciona el nivel de acceso.</p></div></div><form className="form-grid" onSubmit={addUser}><Field label="Nombre"><input required value={userForm.name} onChange={e=>setUserForm({...userForm,name:e.target.value})} placeholder="Nombre del trabajador"/></Field><Field label="Tipo de cuenta"><select value={userForm.role} onChange={e=>setUserForm({...userForm,role:e.target.value})}><option>Usuario simple</option><option>Administrador</option></select></Field><div className="notice inline-notice"><span>!</span><p>Este formulario es demostrativo. No crea credenciales seguras ni cuentas reales hasta configurar Supabase Auth.</p></div><button className="primary-button full">Añadir usuario de prueba</button></form></div><div className="panel"><div className="panel-heading"><div><h3>Usuarios</h3><p>Vista de demostración</p></div></div><div className="simple-list">{users.map(u=><div className="list-line" key={u.id}><div><b>{u.name}</b><small>{u.role}</small></div><span className="role-pill">{u.role==='Administrador'?'ADMIN':'USUARIO'}</span></div>)}</div></div></div>}
        {section==='reportes' && <div className="report-grid"><Report icon="▦" title="Inventario actual" desc="Descarga un archivo CSV con los artículos de prueba." button="Exportar inventario" onClick={downloadCsv}/><Report icon="＋" title="Compras" desc="Resumen de las compras capturadas en esta sesión." button="Descargar CSV" onClick={()=>downloadTable('compras.csv',[['Fecha','Artículo','Cantidad','Precio','Impuesto','Total'],...purchases.map(p=>[p.date,p.article,p.quantity,p.price,p.tax,p.total])])}/><Report icon="$" title="Pagos" desc="Resumen de pagos capturados en esta sesión." button="Descargar CSV" onClick={()=>downloadTable('pagos.csv',[['Fecha','Motivo','Descripción','Importe'],...payments.map(p=>[p.date,p.reason,p.description,p.amount])])}/><Report icon="↗" title="Ventas por día" desc="Exporta las cantidades ingresadas en esta sesión." button="Descargar CSV" onClick={()=>downloadTable('ventas.csv',[['Plato','Cantidad','Precio','Total'],...dishes.map(d=>[d.name,sales[d.id]?.qty||0,d.price,(sales[d.id]?.qty||0)*d.price])])}/></div>}
        {toast&&<div className="toast">✓ {toast}</div>}
        <footer>© {new Date().getFullYear()} Sabor Divino Servicio Exprés <span>·</span> Primera versión de desarrollo</footer>
      </div>
    </main>
  </div>;
}
function Stat({icon,label,value,note}){return <div className="stat-card"><div className="stat-top"><span className="stat-icon">{icon}</span><span className="stat-label">{label}</span></div><strong className="stat-value">{value}</strong><small>{note}</small></div>}
function Quick({icon,title,desc,onClick}){return <button className="quick-action" onClick={onClick}><span className="quick-icon">{icon}</span><span><b>{title}</b><small>{desc}</small></span><span className="arrow">↗</span></button>}
function Field({label,children}){return <label className="field"><span>{label}</span>{children}</label>}
function Empty({text}){return <div className="empty"><span>▤</span><p>{text}</p></div>}
function ArticleTable({rows,search,setSearch,onDelete}){const filtered=rows.filter(a=>a.name.toLowerCase().includes(search.toLowerCase()));return <><div className="table-tools"><input placeholder="Buscar artículo..." value={search} onChange={e=>setSearch(e.target.value)}/><span>{filtered.length} artículos</span></div><div className="table-wrap"><table><thead><tr><th>Artículo</th><th>Unidad</th><th>Existencias</th><th>Mínimo</th>{onDelete&&<th></th>}</tr></thead><tbody>{filtered.map(a=><tr key={a.id}><td><b>{a.name}</b></td><td>{a.unit}</td><td><span className={`stock-pill ${a.stock<=a.minimum?'low':''}`}>{a.stock}</span></td><td>{a.minimum}</td>{onDelete&&<td><button className="text-button" onClick={()=>onDelete(a.id)}>Eliminar</button></td>}</tr>)}</tbody></table>{!filtered.length&&<Empty text="No hay artículos que mostrar. Añade uno para empezar."/>}</div></>}
function Report({icon,title,desc,button,onClick}){return <div className="panel report-card"><span className="report-icon">{icon}</span><h3>{title}</h3><p>{desc}</p><button className="outline-button" onClick={onClick}>{button} ↓</button></div>}
function money(value){return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(value)||0)}
function downloadTable(filename,rows){const csv=rows.map(r=>r.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\n');const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url)}

createRoot(document.getElementById('root')).render(<App/>);
