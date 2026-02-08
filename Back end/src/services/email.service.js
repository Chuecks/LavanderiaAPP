const nodemailer = require('nodemailer');

// Comprobar que la configuración de email esté lista (evita errores poco claros de nodemailer)
const comprobarConfigEmail = () => {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    if (!user || !pass) {
        const msg = '⚠️ Faltan EMAIL_USER o EMAIL_PASS en el entorno. Crea/edita Back end/.env con tu Gmail y contraseña de aplicación. Los emails no se enviarán.';
        console.error(msg);
        throw new Error(msg);
    }
    const destino = process.env.EMAIL_DESTINO || user;
    return { user, pass, destino };
};

// Configurar el transporter de email
const crearTransporter = () => {
    comprobarConfigEmail();
    return nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

// Enviar email de notificación de nuevo pedido (mismo flujo que "olvidé contraseña")
const enviarEmailPedido = async (pedidoData) => {
    // Igual que enviarEmailNuevaContrasena: primero comprobar config y crear transporter
    comprobarConfigEmail();
    const transporter = crearTransporter();
    const emailDestino = process.env.EMAIL_DESTINO || process.env.EMAIL_USER;

    // Datos seguros para no lanzar antes de sendMail (como en olvidé contraseña)
    const d = (obj, key, def = '') => (obj && obj[key] != null ? String(obj[key]) : def);
    const rec = pedidoData?.direccionRecogida || {};
    const ent = pedidoData?.direccionEntrega || {};
    const dirRecogida = `${d(rec, 'calle')} ${d(rec, 'numeroPuerta')} ${d(rec, 'numeroApartamento') ? 'Apt. ' + rec.numeroApartamento : ''} ${d(rec, 'ciudad')}, ${d(rec, 'departamento')} CP: ${d(rec, 'codigoPostal')}`.trim();
    const dirEntrega = `${d(ent, 'calle')} ${d(ent, 'numeroPuerta')} ${d(ent, 'numeroApartamento') ? 'Apt. ' + ent.numeroApartamento : ''} ${d(ent, 'ciudad')}, ${d(ent, 'departamento')} CP: ${d(ent, 'codigoPostal')}`.trim();
    const servicioNombre = (pedidoData?.servicio && pedidoData.servicio.nombre) ? pedidoData.servicio.nombre : 'Servicio';
    const servicioPrecio = (pedidoData?.servicio && pedidoData.servicio.precio != null) ? Number(pedidoData.servicio.precio).toLocaleString() : '0';
    const usuario = pedidoData?.usuario || {};
    const lav = pedidoData?.lavanderia;
    const lavanderiaLinea = lav ? `Lavandería: ${lav.nombre || 'N/A'} - ${[lav.calle, lav.numeroPuerta, lav.ciudad].filter(Boolean).join(', ')}` : '';
    const idPedido = (pedidoData && (pedidoData._id || pedidoData.id)) ? String(pedidoData._id || pedidoData.id) : 'N/A';
    const fechaPedido = pedidoData?.createdAt ? new Date(pedidoData.createdAt).toLocaleString('es-UY') : new Date().toLocaleString('es-UY');
    const horarioRec = d(pedidoData, 'horarioRecogida', 'N/A');
    const horarioEnt = d(pedidoData, 'horarioEntrega', 'N/A');
    const notas = d(pedidoData, 'notas');

    const mailOptions = {
        from: `"Lavadero App" <${process.env.EMAIL_USER}>`,
        to: emailDestino,
        subject: `Nuevo Pedido - ${servicioNombre}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #4A90E2; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
                    .section { margin-bottom: 20px; padding: 15px; background-color: white; border-radius: 5px; }
                    .section-title { color: #4A90E2; font-weight: bold; margin-bottom: 10px; }
                    .info-row { margin: 8px 0; }
                    .label { font-weight: bold; color: #666; }
                    .value { color: #333; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Nuevo Pedido Recibido</h1>
                    </div>
                    <div class="content">
                        <div class="section">
                            <div class="section-title">Información del Pedido</div>
                            <div class="info-row"><span class="label">ID:</span> <span class="value">${idPedido}</span></div>
                            <div class="info-row"><span class="label">Estado:</span> <span class="value">${d(pedidoData, 'estado', 'Pendiente')}</span></div>
                            <div class="info-row"><span class="label">Fecha:</span> <span class="value">${fechaPedido}</span></div>
                        </div>
                        <div class="section">
                            <div class="section-title">Cliente</div>
                            <div class="info-row"><span class="label">Nombre:</span> <span class="value">${d(usuario, 'nombre', 'N/A')}</span></div>
                            <div class="info-row"><span class="label">Email:</span> <span class="value">${d(usuario, 'email', 'N/A')}</span></div>
                            <div class="info-row"><span class="label">Teléfono:</span> <span class="value">${d(usuario, 'telefono', 'N/A')}</span></div>
                        </div>
                        <div class="section">
                            <div class="section-title">Servicio</div>
                            <div class="info-row"><span class="label">Nombre:</span> <span class="value">${servicioNombre}</span></div>
                            <div class="info-row"><span class="label">Precio:</span> <span class="value">$${servicioPrecio}</span></div>
                        </div>
                        <div class="section">
                            <div class="section-title">Dirección de Recogida</div>
                            <div class="value">${dirRecogida.replace(/\n/g, '<br>')}</div>
                        </div>
                        <div class="section">
                            <div class="section-title">Dirección de Entrega</div>
                            <div class="value">${dirEntrega.replace(/\n/g, '<br>')}</div>
                        </div>
                        <div class="section">
                            <div class="section-title">Horarios</div>
                            <div class="info-row"><span class="label">Recogida:</span> <span class="value">${horarioRec}</span></div>
                            <div class="info-row"><span class="label">Entrega:</span> <span class="value">${horarioEnt}</span></div>
                        </div>
                        ${notas ? `<div class="section"><div class="section-title">Notas</div><div class="value">${String(notas).replace(/</g, '&lt;')}</div></div>` : ''}
                    </div>
                    <div class="footer">
                        <p>Email automático Lavadero App. Procesa este pedido lo antes posible.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: [
            'Nuevo Pedido Recibido',
            'ID: ' + idPedido,
            'Cliente: ' + d(usuario, 'nombre', 'N/A') + ' - ' + d(usuario, 'email', 'N/A') + ' - ' + d(usuario, 'telefono', 'N/A'),
            'Servicio: ' + servicioNombre + ' - $' + servicioPrecio,
            'Recogida: ' + dirRecogida,
            lavanderiaLinea,
            'Entrega: ' + dirEntrega,
            'Horario recogida: ' + horarioRec,
            'Horario entrega: ' + horarioEnt,
            notas ? 'Notas: ' + notas : ''
        ].filter(Boolean).join('\n')
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email de nuevo pedido enviado:', info.messageId);
    return info;
};

// Enviar email con nueva contraseña (restablecer contraseña)
const enviarEmailNuevaContrasena = async (emailDestino, nombreUsuario, nuevaContrasena) => {
    try {
        comprobarConfigEmail();
        const transporter = crearTransporter();
        const mailOptions = {
            from: `"Lavadero App" <${process.env.EMAIL_USER}>`,
            to: emailDestino,
            subject: 'Lavadero App - Nueva contraseña',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background-color: #4A90E2; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                        .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
                        .password-box { background: #fff; border: 2px dashed #4A90E2; padding: 15px; margin: 15px 0; font-family: monospace; font-size: 18px; letter-spacing: 2px; }
                        .advice { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 15px 0; }
                        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🔐 Restablecimiento de contraseña</h1>
                        </div>
                        <div class="content">
                            <p>Hola${nombreUsuario ? ` ${nombreUsuario}` : ''},</p>
                            <p>Se ha generado una nueva contraseña para tu cuenta en Lavadero App.</p>
                            <p><strong>Tu nueva contraseña temporal es:</strong></p>
                            <div class="password-box">${nuevaContrasena}</div>
                            <div class="advice">
                                <strong>💡 Consejo de seguridad:</strong> Te recomendamos iniciar sesión y cambiar esta contraseña por una personal en tu perfil, para mayor seguridad.
                            </div>
                            <p>Si no solicitaste este cambio, contacta con soporte.</p>
                        </div>
                        <div class="footer">
                            <p>Este es un email automático de Lavadero App. No respondas a este mensaje.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `Hola${nombreUsuario ? ` ${nombreUsuario}` : ''},\n\nSe ha generado una nueva contraseña para tu cuenta en Lavadero App.\n\nTu nueva contraseña temporal es: ${nuevaContrasena}\n\nConsejo de seguridad: Te recomendamos iniciar sesión y cambiar esta contraseña por una personal en tu perfil.\n\nSi no solicitaste este cambio, contacta con soporte.\n\nLavadero App.`
        };
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email de nueva contraseña enviado:', info.messageId);
        return info;
    } catch (error) {
        console.error('❌ Error al enviar email de nueva contraseña:', error);
        throw error;
    }
};

module.exports = {
    enviarEmailPedido,
    enviarEmailNuevaContrasena,
    crearTransporter
};
