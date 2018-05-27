module.exports = function (sequelize, DataTypes) {
    const CheckinTag = sequelize.define('CheckinTag', {}, { timestamps: false })

    CheckinTag.associate = (models) => {
        CheckinTag.belongsTo(models.Tag)
        CheckinTag.belongsTo(models.Checkin)
    }

    return CheckinTag
}