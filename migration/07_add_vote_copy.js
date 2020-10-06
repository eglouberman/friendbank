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
    'voteStatus.label': {
      [ENGLISH]: 'Make a plan to vote for Marquita in the US Senate election!',
    },
    'voteStatus.subtitle': {
      [ENGLISH]: 'Our future and our planet are on the line. Make your voice heard by making a plan to vote for Marquita Bradshaw in the US Senate Tennessee Election. If you have not already applied to vote by mail, please make a plan to vote early or on Election Day.',
    },
    'voteStatus.options': {
      [ENGLISH]: [
        'I’ve already voted',
        'I’ve received my mail-in ballot and still need to return it',
        'I’m planning to vote early between Octover 14 - 29',
        'I’m planning to vote on Election Day, November 3',
      ],
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
