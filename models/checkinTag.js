module.exports = function (sequelize, DataTypes) {
    const CheckinTag = sequelize.define('CheckinTag', {}, { timestamps: false })

    return CheckinTag
}