const { config } = require("@ssff/bootstrap");
const Service = require("./service");
const { createError } = require("../error/managerError");
const { connectToMongo } = require('../db/mongoClient');
const {
  url: {
    getContactDetails: urlGetContactDetails,
    registroMarca: urlRegistroMarca,
    getMarcaContratoCliente: urlGetMarcaContratoCliente,
  },
} = config;

const normalizeDV = (clientDV) => {
  if (clientDV === 'k') {
    return clientDV.toUpperCase();
  }
  return clientDV;
};

const getContactDetails = (req) =>
  new Promise(async (resolve, reject) => {
    let { logger } = req.request;
    try {
      const { client } = req.request;

      // Separar ClientID y ClientDV
      const clientID = client.slice(0, -1);
      let clientDV = client.slice(-1);

      // Asegurar que el DV sea mayúscula
      clientDV = normalizeDV(clientDV);

      // Conectar a MongoDB
      const db = await connectToMongo();
      const collection = db.collection('BUP_CONTACT_DETAIL');

      // Buscar el cliente en la base de datos
      const cliente = await collection.findOne({ clientID, clientDV });

      if (!cliente) {
        reject(Service.rejectResponse("Cliente no encontrado",404));
        return;
      }

      const recordCreationDate = cliente.registrationDate ? new Date(cliente.registrationDate).toISOString() : null;

      // Función para calcular los días desde la última modificación
      const calculateDaysSinceModification = (modifiedAt) => {
        if (!modifiedAt) return null;
        const currentDate = new Date();
        const modifiedDate = new Date(modifiedAt);
        const timeDiff = Math.abs(currentDate - modifiedDate);
        return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      };

      // Calcular los días transcurridos para email y mobilePhone
      const qtyDaysLastModificationEmail = cliente.email?.modifiedAt
        ? calculateDaysSinceModification(cliente.email.modifiedAt)
        : 0;

      const qtyDaysLastModificationMobilePhone = cliente.mobilePhone?.modifiedAt
        ? calculateDaysSinceModification(cliente.mobilePhone.modifiedAt)
        : 0;

      // Crear el objeto de respuesta
      const responseObject = {
        id: cliente._id,
        clientID: cliente.clientID,
        clientDV: cliente.clientDV,
        address: cliente.address?.value || null,
        apartment: cliente.apartment?.value || null,
        block: cliente.block?.value || null,
        commune: cliente.commune?.value || null,
        region: cliente.region?.value || null,
        latitude: cliente.latitude?.value || null,
        longitude: cliente.longitude?.value || null,
        email: cliente.email?.value || null,
        mobilePhone: cliente.mobilePhone?.value || null,
        qtyDaysLastModificationEmail,
        qtyDaysLastModificationMobilePhone,
        customerType: cliente.customerType?.value || null,
        landlinePhone: cliente.landlinePhone?.value || null,
        mobileActiveWSP: cliente.mobileActiveWSP?.value || null,
        mobileProtectionMark: cliente.mobileProtectionMark?.value || null,
        channel: cliente.channel || null,
        product: cliente.product?.value || null,
        process: cliente.process?.value || null,
        emailProtectionMark: cliente.emailProtectionMark?.value || null,
        eeccSubscription: cliente.eeccSubscription?.value || null,
        dataConsentMark: cliente.dataConsentMark?.value || null,
        registrationDate: recordCreationDate,
        requestNumber: cliente.requestNumber?.value || null,
        internalBlocking: cliente.internalBlocking?.value || null,
      };
      console.log(responseObject)
      resolve(Service.successResponse(responseObject));
    } catch (e) {
      logger.error("Error en getContactDetailsInfo", e);
      reject(Service.rejectResponse(e.message, e.code));
    } finally {
      logger.info("Fin getContactDetailsInfo");
    }
  });

const postContactDetailsInfo = (req) =>
  new Promise(async (resolve, reject) => {
    let { logger } = req.body; 
    try {
      let request = req.body;
      delete request.logger;
      const db = await connectToMongo();
      const contactDetailCollection = db.collection('BUP_CONTACT_DETAIL');
      const blacklistCollection = db.collection('BUP_DOMAIN_BLACKLIST');
      const emailBlacklistCollection = db.collection('BUP_EMAILS_BLACKLIST');

      // Lista de campos permitidos
      const allowedFields = [
        'clientID', 'clientDV', 'clientMug', 'address', 'apartment', 'block',
        'commune', 'region', 'latitude', 'longitude', 'email', 'customerType',
        'landlinePhone', 'mobilePhone', 'mobileActiveWSP', 'mobileProtectionMark',
        'product', 'channel', 'process', 'emailProtectionMark', 'eeccSubscription',
        'dataConsentMark', 'requestNumber', 'internalBlocking', 'originDate', 'ip'
      ];

      // Verificar si se recibieron campos no permitidos
      const receivedFields = Object.keys(request);
      const invalidFields = receivedFields.filter(field => !allowedFields.includes(field));

      if (invalidFields.length > 0) {
        reject(Service.rejectResponse(`Campos no permitidos encontrados: ${invalidFields.join(', ')}`, 400));
        return;
      }
      const { clientID, clientDV, email, originDate, clientMug, channel, ...otherData } = request;
      // Verificar si el correo electrónico está en la lista negra
      if (email && email) {
        const isEmailBlacklisted = await emailBlacklistCollection.findOne({ email })
        if (isEmailBlacklisted) {
          reject(Service.rejectResponse("El correo está bloqueado",403));
        return;
        }

        const emailParts = email.split('@');
        if (emailParts.length !== 2) {
          reject(Service.rejectResponse("Correo inválido",400));
          return;
        }
        const domain = emailParts[1];
        const isDomainBlacklisted = await blacklistCollection.findOne({ domain });
        if (isDomainBlacklisted) {
          reject(Service.rejectResponse("El dominio del correo está bloqueado",403));
          return;

        }

        const existingEmail = await contactDetailCollection.findOne({
          'email.value': email
        });

        if (existingEmail) {
          reject(Service.rejectResponse("El correo ya está registrado en otro cliente",409));
          return;
        }
      }

      // Verificar si el cliente ya existe
      const existingClient = await contactDetailCollection.findOne({ clientID, clientDV });
      if (existingClient) {
        reject(Service.rejectResponse("Cliente ya registrado",409));
        return;
      }

      const currentDate = new Date();

      // Asegúrate de que los campos tengan la estructura correcta según el esquema
      const dataToInsert = {
        clientID,
        clientDV,
        clientMug,
        channel,
        email: { value: email, channelModification: request.channel, modifiedAt: currentDate },
        ...Object.entries(otherData).reduce((acc, [key, value]) => {
          acc[key] = {
            value: value, // Asumimos que los valores ya son strings como solicitaste
            channelModification: request.channel,
            modifiedAt: currentDate
          };
          return acc;
        }, {}),
        originDate: originDate,
        registrationDate: currentDate  // Fecha de creación en formato MongoDB (ISODate)
      };

      const result = await contactDetailCollection.insertOne(dataToInsert);
      let response =
      {
        message: "Cliente creado exitosamente",
        clientID,
        clientMug,
        bupID: result.insertedId
      };
      resolve(Service.successResponse(response));
    } catch (e) {
      logger.error("Error en postContactDetailsInfo", e);
      reject(Service.rejectResponse(e.message, e.code));
    } finally {
      logger.info("Fin postContactDetailsInfo");
    }

  });

const putContactDetailsInfo = (req) =>
  new Promise(async (resolve, reject) => {
    let { logger } = req.body;
    console.log("req.body", req.body);
    try {
      let request = req.body;
      delete request.logger;
      const db = await connectToMongo();
      const contactDetailCollection = db.collection('BUP_CONTACT_DETAIL');
      const blacklistCollection = db.collection('BUP_DOMAIN_BLACKLIST');
      const emailBlacklistCollection = db.collection('BUP_EMAILS_BLACKLIST');
      const binnacleCollection = db.collection('BUP_CONTACT_DETAIL_BINNACLE');

      // Extraer los campos necesarios del cuerpo de la solicitud
      const {
        clientID,
        clientDV,
        channel, // Usaremos 'channel' para 'channelModification'
        email,
        ...updateData
      } = request;

      const currentDate = new Date();
      const normalizedDV = normalizeDV(clientDV);

      // Buscar el cliente existente
      const existingClient = await contactDetailCollection.findOne({ clientID, clientDV: normalizedDV });
      if (!existingClient) {
        reject(Service.rejectResponse("'Cliente no encontrado",404));
        return;
      }

      // Guardar los datos antiguos en la bitácora antes de actualizar
      const oldData = { ...existingClient };
      delete oldData._id;
      await binnacleCollection.insertOne({ ...oldData, modifiedAt: currentDate });

      const updatedFields = {};

      // Validaciones y actualizaciones específicas para el campo 'email'
      if (email && email !== existingClient.email?.value) {
        // Verificar si el correo está en la lista negra
        const isEmailBlacklisted = await emailBlacklistCollection.findOne({ 'email.value': email });
        if (isEmailBlacklisted) {
          reject(Service.rejectResponse("El correo está bloqueado",403));
          return;
        }

        // Verificar si el correo ya está registrado en otro cliente
        const existingEmail = await contactDetailCollection.findOne({
          'email.value': email,
          clientID: { $ne: clientID }
        });

        if (existingEmail) {
          reject(Service.rejectResponse("El correo ya está registrado en otro cliente",409));
          return;
        }

        // Validar la estructura del correo y su dominio
        const emailParts = email.split('@');
        if (emailParts.length !== 2) {
          reject(Service.rejectResponse("Correo inválido",400));
          return;
        }

        const domain = emailParts[1];
        const isBlacklisted = await blacklistCollection.findOne({ domain });
        if (isBlacklisted) {
          reject(Service.rejectResponse("El dominio del correo está bloqueado",403));
          return;
        }

        // Actualizar el campo email si ha pasado todas las validaciones
        updatedFields.email = {
          value: email,
          channelModification: channel || existingClient.email?.channelModification ,
          modifiedAt: currentDate
        };
      }

      // Definir qué campos deben ser objetos con 'value', 'channelModification' y 'modifiedAt'
      const fieldsToTransform = ['address', 'apartment', 'block', 'commune', 'region', 'latitude', 'longitude', 'customerType', 'landlinePhone', 'mobilePhone', 'mobileActiveWSP', 'mobileProtectionMark', 'product', 'process', 'emailProtectionMark', 'eeccSubscription', 'dataConsentMark', 'requestNumber', 'internalBlocking', 'ip'];

      // Iterar sobre los campos y actualizar solo los que hayan cambiado
      fieldsToTransform.forEach(field => {
        if (updateData[field]) {
          // Si el campo existe como objeto en la base de datos
          if (existingClient[field] && typeof existingClient[field] === 'object') {
            // Solo actualizamos si el valor ha cambiado
            if (updateData[field] !== existingClient[field].value) {
              updatedFields[field] = {
                value: updateData[field],
                channelModification: channel || existingClient[field].channelModification,
                modifiedAt: currentDate
              };
            }
          } else {
            // Si el campo no es un objeto, o es un campo nuevo, lo creamos
            updatedFields[field] = {
              value: updateData[field],
              channelModification: channel,
              modifiedAt: currentDate
            };
          }
        }
      });

      console.log('Campos actualizados:', updatedFields);

      // Realizar la actualización solo de los campos modificados
      if (Object.keys(updatedFields).length > 0) {
        const result = await contactDetailCollection.updateOne(
          { clientID, clientDV: normalizedDV },
          { $set: updatedFields }
        );

        if (result.matchedCount === 0) {
          reject(Service.rejectResponse("Cliente no encontrado",404));
          return;
        }
      } else {
        reject(Service.rejectResponse("No hay cambios para actualizar",204));
        return;

        
      }
      resolve(Service.successResponse({ message: 'Cliente actualizado exitosamente' }));
    } catch (e) {
      logger.error("Error en putContactDetailsInfo", e);
      reject(Service.rejectResponse(e.message, e.code));
    } finally {
      logger.info("Fin putContactDetailsInfo");
    }
  });

module.exports = {
  getContactDetails,
  postContactDetailsInfo,
  putContactDetailsInfo
};
