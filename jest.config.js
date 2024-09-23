module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    setupFilesAfterEnv: ['./jest.setup.js'],
    collectCoverage: true,
    testPathIgnorePatterns: ['/node_modules/', '/dist/', '/coverage/'],
    transform: {
        '^.+\\.(ts)$': 'ts-jest',
        '^.+\\.(js)$': 'babel-jest',
    },
    coverageThreshold: {
        global: {
            lines: 80,
        },
    },
};
