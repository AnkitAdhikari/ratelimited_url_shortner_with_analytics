import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../client.js';

class Url extends Model {
  declare id: number; // this is ok! The 'declare' keyword ensures this field will not be emitted by TypeScript.
  declare alias: string;
  declare longURL: string;
}

Url.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    alias: {
      type: DataTypes.CHAR(6),
      allowNull: false,
      unique: true,
    },
    longURL: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  { sequelize, tableName: 'urls', timestamps: false },
);

export default Url;
