const admin = require('firebase-admin');

if (!admin.apps.length) {
  try {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    console.log('FirebaseAdmin.js: Variável FIREBASE_SERVICE_ACCOUNT_KEY carregada.');
    // console.log('Valor bruto da chave de serviço:', serviceAccountString); // CUIDADO: Não deixe isso em produção pois expõe a chave

    const serviceAccount = JSON.parse(serviceAccountString);
    console.log('FirebaseAdmin.js: JSON da chave de serviço parseado com sucesso.');

    // Corrigir a chave privada
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    console.log('FirebaseAdmin.js: Quebras de linha da chave privada corrigidas.');
    // console.log('Chave privada corrigida (início):', serviceAccount.private_key.substring(0, 30) + '...'); // CUIDADO: Não deixe isso em produção

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('FirebaseAdmin.js: Firebase Admin SDK inicializado com sucesso!');

  } catch (error) {
    console.error('FirebaseAdmin.js: ERRO durante a inicialização do Firebase Admin SDK:', error);
    // console.error('Stack do erro:', error.stack); // Para mais detalhes do erro
    // console.error('Variável de ambiente length:', process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? process.env.FIREBASE_SERVICE_ACCOUNT_KEY.length : 'undefined');
    // console.error('Primeiros 100 caracteres da variável de ambiente:', process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? process.env.FIREBASE_SERVICE_ACCOUNT_KEY.substring(0, 100) : 'undefined');
  }
} else {
  console.log('FirebaseAdmin.js: Firebase Admin SDK já estava inicializado. Ignorando.');
}

module.exports = admin;