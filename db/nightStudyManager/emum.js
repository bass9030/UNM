const PERIOD = {
    A1: "A1",
    N1: "N1",
    N2: "N2",
};

const ROLE = {
    STUDENT: 0,
    ADMIN: 1,
    CHECKOUT: 2,
};

Object.freeze(PERIOD);
Object.freeze(ROLE);

module.exports = { PERIOD, ROLE };
