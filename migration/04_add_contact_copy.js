const { MongoClient, ObjectId } = require('mongodb');

const {
  MONGODB_URL,
} = process.env;

const { ENGLISH, SPANISH } = require('../src/shared/lang');

(async function() {
  const client = await MongoClient.connect(MONGODB_URL, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  });

  db = client.db();

  const campaigns = db.collection('campaigns');

  const bradshawCampaign = await campaigns.findOne({ domains: 'support.marquitabradshaw.com' });

  const copy = JSON.stringify({
    ...JSON.parse(bradshawCampaign.copy),
    'phonebankPage.successfullySubmitted': {
      [ENGLISH]: 'Successfully submitted contact!',
      [SPANISH]: '¡Contacto creado con éxito!',
    },
  });

  await campaigns.updateOne(
    { domains: 'support.marquitabradshaw.com' },
    {
      '$set': {
        copy,
      },
    },
  );

  process.exit(0);
})();
