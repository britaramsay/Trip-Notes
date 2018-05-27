module.exports = function (sequelize, DataTypes) {
    const Tag = sequelize.define('Tag', {
        Name: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
            validate: {
                len: [1],
            }
        }
    }, {timestamps: false})

    // TODO: relationships

    return Tag
}