const nodemailer = require('nodemailer');

// Configurar el transporter de email
const crearTransporter = () => {
    return nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

// Enviar email de notificación de nuevo pedido
const enviarEmailPedido = async (pedidoData) => {
    try {
        const emailDestino = process.env.EMAIL_DESTINO || process.env.EMAIL_USER;
        if (!emailDestino) {
            console.warn('⚠️ EMAIL_DESTINO y EMAIL_USER no configurados. No se enviará email.');
            return;
        }
        if (!process.env.EMAIL_PASS) {
            console.warn('⚠️ EMAIL_PASS no configurado. Para Gmail usa una "Contraseña de aplicación".');
        }
        const transporter = crearTransporter();
        
        // Formatear dirección de recogida
        const dirRecogida = `
            ${pedidoData.direccionRecogida.calle} ${pedidoData.direccionRecogida.numeroPuerta}
            ${pedidoData.direccionRecogida.numeroApartamento ? `Apt. ${pedidoData.direccionRecogida.numeroApartamento}` : ''}
            ${pedidoData.direccionRecogida.ciudad}, ${pedidoData.direccionRecogida.departamento}
            Código Postal: ${pedidoData.direccionRecogida.codigoPostal}
        `.trim();
        
        // Formatear dirección de entrega
        const dirEntrega = `
            ${pedidoData.direccionEntrega.calle} ${pedidoData.direccionEntrega.numeroPuerta}
            ${pedidoData.direccionEntrega.numeroApartamento ? `Apt. ${pedidoData.direccionEntrega.numeroApartamento}` : ''}
            ${pedidoData.direccionEntrega.ciudad}, ${pedidoData.direccionEntrega.departamento}
            Código Postal: ${pedidoData.direccionEntrega.codigoPostal}
        `.trim();

        // Lavandería asignada (si existe)
        const lavanderia = pedidoData.lavanderia;
        const lavanderiaHtml = lavanderia ? `
                            <div class="section">
                                <div class="section-title">🏪 Lavandería asignada a este pedido</div>
                                <div class="info-row">
                                    <span class="label">Nombre:</span>
                                    <span class="value">${lavanderia.nombre || 'N/A'}</span>
                                </div>
                                <div class="info-row">
                                    <span class="label">Dirección:</span>
                                    <span class="value">${[lavanderia.calle, lavanderia.numeroPuerta].filter(Boolean).join(' ')}${lavanderia.numeroApartamento ? `, Apt. ${lavanderia.numeroApartamento}` : ''}, ${lavanderia.ciudad || ''}, ${lavanderia.departamento || ''}${lavanderia.codigoPostal ? ` (CP ${lavanderia.codigoPostal})` : ''}</span>
                                </div>
                                ${lavanderia.barrio ? `<div class="info-row"><span class="label">Barrio:</span><span class="value">${lavanderia.barrio}</span></div>` : ''}
                            </div>
        ` : '';

        const lavanderiaText = lavanderia ? `
Lavandería asignada a este pedido:
Nombre: ${lavanderia.nombre || 'N/A'}
Dirección: ${[lavanderia.calle, lavanderia.numeroPuerta].filter(Boolean).join(' ')}${lavanderia.numeroApartamento ? `, Apt. ${lavanderia.numeroApartamento}` : ''}, ${lavanderia.ciudad || ''}, ${lavanderia.departamento || ''}${lavanderia.codigoPostal ? ` (CP ${lavanderia.codigoPostal})` : ''}${lavanderia.barrio ? `\nBarrio: ${lavanderia.barrio}` : ''}
` : '';

        // Información del usuario
        const usuarioInfo = pedidoData.usuario ? `
            <strong>Cliente:</strong> ${pedidoData.usuario.nombre || 'N/A'}<br>
            <strong>Email:</strong> ${pedidoData.usuario.email || 'N/A'}<br>
            <strong>Teléfono:</strong> ${pedidoData.usuario.telefono || 'N/A'}<br>
        ` : '';
        
        const mailOptions = {
            from: `"Lavadero App" <${process.env.EMAIL_USER}>`,
            to: emailDestino,
            subject: `Nuevo Pedido - ${pedidoData.servicio?.nombre || 'Servicio'}`,
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
                            <h1>🔄 Nuevo Pedido Recibido</h1>
                        </div>
                        <div class="content">
                            <div class="section">
                                <div class="section-title">📋 Información del Pedido</div>
                                <div class="info-row">
                                    <span class="label">ID del Pedido:</span>
                                    <span class="value">${pedidoData._id || pedidoData.id || 'N/A'}</span>
                                </div>
                                <div class="info-row">
                                    <span class="label">Estado:</span>
                                    <span class="value">${pedidoData.estado || 'Pendiente'}</span>
                                </div>
                                <div class="info-row">
                                    <span class="label">Fecha de Creación:</span>
                                    <span class="value">${new Date(pedidoData.createdAt || Date.now()).toLocaleString('es-UY')}</span>
                                </div>
                            </div>
                            
                            <div class="section">
                                <div class="section-title">👤 Información del Cliente</div>
                                ${usuarioInfo}
                            </div>
                            
                            <div class="section">
                                <div class="section-title">🛍️ Servicio Solicitado</div>
                                <div class="info-row">
                                    <span class="label">Nombre:</span>
                                    <span class="value">${pedidoData.servicio?.nombre || 'N/A'}</span>
                                </div>
                                <div class="info-row">
                                    <span class="label">Precio:</span>
                                    <span class="value">$${pedidoData.servicio?.precio?.toLocaleString() || '0'}</span>
                                </div>
                                ${pedidoData.servicio?.descripcion ? `
                                    <div class="info-row">
                                        <span class="label">Descripción:</span>
                                        <span class="value">${pedidoData.servicio.descripcion}</span>
                                    </div>
                                ` : ''}
                            </div>
                            
                            <div class="section">
                                <div class="section-title">📍 Dirección de Recogida</div>
                                <div class="value">${dirRecogida.replace(/\n/g, '<br>')}</div>
                            </div>
                            ${lavanderiaHtml}
                            <div class="section">
                                <div class="section-title">📍 Dirección de Entrega</div>
                                <div class="value">${dirEntrega.replace(/\n/g, '<br>')}</div>
                            </div>
                            
                            <div class="section">
                                <div class="section-title">⏰ Horarios</div>
                                <div class="info-row">
                                    <span class="label">Horario de Recogida:</span>
                                    <span class="value">${pedidoData.horarioRecogida || 'N/A'}</span>
                                </div>
                                <div class="info-row">
                                    <span class="label">Horario de Entrega:</span>
                                    <span class="value">${pedidoData.horarioEntrega || 'N/A'}</span>
                                </div>
                            </div>
                            
                            ${pedidoData.notas ? `
                                <div class="section">
                                    <div class="section-title">📝 Notas Adicionales</div>
                                    <div class="value">${pedidoData.notas}</div>
                                </div>
                            ` : ''}
                        </div>
                        <div class="footer">
                            <p>Este es un email automático del sistema Lavadero App</p>
                            <p>Por favor, procesa este pedido lo antes posible.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
Nuevo Pedido Recibido

ID del Pedido: ${pedidoData._id || pedidoData.id || 'N/A'}
Estado: ${pedidoData.estado || 'Pendiente'}

Información del Cliente:
${pedidoData.usuario ? `
Cliente: ${pedidoData.usuario.nombre || 'N/A'}
Email: ${pedidoData.usuario.email || 'N/A'}
Teléfono: ${pedidoData.usuario.telefono || 'N/A'}
` : ''}

Servicio Solicitado:
Nombre: ${pedidoData.servicio?.nombre || 'N/A'}
Precio: $${pedidoData.servicio?.precio?.toLocaleString() || '0'}
${pedidoData.servicio?.descripcion ? `Descripción: ${pedidoData.servicio.descripcion}` : ''}

Dirección de Recogida:
${dirRecogida}
${lavanderiaText}

Dirección de Entrega:
${dirEntrega}

Horarios:
Recogida: ${pedidoData.horarioRecogida || 'N/A'}
Entrega: ${pedidoData.horarioEntrega || 'N/A'}

${pedidoData.notas ? `Notas: ${pedidoData.notas}` : ''}
            `.trim()
        };
        
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email enviado exitosamente:', info.messageId);
        return info;
    } catch (error) {
        console.error('❌ Error al enviar email:', error);
        throw error;
    }
};

// Enviar email con nueva contraseña (restablecer contraseña)
const enviarEmailNuevaContrasena = async (emailDestino, nombreUsuario, nuevaContrasena) => {
    try {
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
