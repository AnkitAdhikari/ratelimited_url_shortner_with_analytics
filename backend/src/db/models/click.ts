import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../client.js';

class Click extends Model {
  declare id: number; // this is ok! The 'declare' keyword ensures this field will not be emitted by TypeScript.
  declare urlId: number;
  declare ipAddress: string | null;
  declare clickedAt: Date;
}

Click.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    urlId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'urls',
        key: 'id',
      },
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    clickedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  { sequelize, tableName: 'clicks', timestamps: false },
);

export default Click;
