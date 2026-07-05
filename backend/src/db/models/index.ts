import Url from './url.js';
import Click from './click.js';

Url.hasMany(Click, { foreignKey: 'urlId', as: 'clicks' });
Click.belongsTo(Url, { foreignKey: 'urlId', as: 'url' });

export { Url, Click };
