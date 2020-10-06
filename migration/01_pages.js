const { MongoClient, ObjectId } = require('mongodb');
const setupDb = require('../src/api/db/setup');
const { randomToken } = require('../src/api/utils/auth');
const { TRANSACTIONAL_EMAIL } = require('../src/shared/emailFrequency');

const {
  MONGODB_URL,
} = process.env;

/**
 * 1. Configure the marquitabradshaw campaign
 * 2. Migrate pages to new schema
 * 3. Create user accounts for all existing page authors
 */

(async function() {
  try {
    const client = await MongoClient.connect(MONGODB_URL, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });

    db = client.db();

    const indexResult = await setupDb(db);

    if (indexResult instanceof Error) {
      throw indexResult;
    }

    const pagesCollection = db.collection('pages');
    const users = db.collection('users');
    const campaigns = db.collection('campaigns');

    const marquitaCampaignData = {
      domains: [
        'marquita-bradshaw-support-prod.herokuapp.com',
        'support.marquitabradshaw.com',
      ],
      name: 'Team Bradshaw',
    };

    const campaignInsertResult = await campaigns.insertOne(marquitaCampaignData);
    const campaign = campaignInsertResult.ops[0];

    const pages = await pagesCollection.find().toArray();

    for (const page of pages) {
      const userData = {
        email: page.createdByEmail,
        password: await randomToken(),
        firstName: page.createdByFirstName,
        zip: page.createdByZip,
        emailFrequency: TRANSACTIONAL_EMAIL,
        createdAt: Date.now(),
        lastUpdatedAt: Date.now(),
        lastAuthenticationUpdate: Date.now(),
      };

      let user = await users.findOne({ email: userData.email });

      if (!user) {
        const userInsertResult = await users.insertOne(userData);
        user = userInsertResult.ops[0];
        console.log(`creating user: email=${userData.email}`);
      }

      const pageUpdate = {
        '$set': {
          campaign: campaign._id.toString(),
          createdBy: user._id.toString(),
          lastUpdatedAt: Date.now(),
          __v: '1',
        },
        '$unset': {
          createdByFirstName: '',
          createdByLastName: '',
          createdByEmail: '',
          createdByPhone: '',
          createdByZip: '',
          totalSignups: '',
        },
      };

      console.log(`updating page: code=${page.code}`);
      await pagesCollection.updateOne({ _id: page._id }, pageUpdate);
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();

// v1 page schema
// {
//     "_id": {
//         "$oid": "5eab38d8c54d590017933971"
//     },
//     "code": "priya-b-899",
//     "createdByFirstName": "Priya",
//     "createdByLastName": "Chatwani",
//     "createdByEmail": "priya@Marquitabradshaw.com",
//     "createdByPhone": "+3107508500",
//     "createdByZip": "90266",
//     "createdAt": 1588279510360,
//     "title": "Priya is sticking with Marquita because...",
//     "subtitle": "Marquita has been always been righteous fighter for working people and environmental justice. We need him in office now more than ever, bringing these fights\u2013our fights\u2013to the floor of the US Senate.",
//     "totalSignups": 3,
//     "background": "air-flight-89"
// }
