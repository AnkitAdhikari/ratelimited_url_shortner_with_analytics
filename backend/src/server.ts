import { app } from './app.js';
import { env, sequelize } from './db/client.js';

app.listen(env.PORT, async () => {
  console.log('server is running ...');
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true }); // REMOVE LATER: production should use migrations
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
});
