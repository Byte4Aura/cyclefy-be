import winston from "winston";
// import DailyRotateFile from "winston-daily-rotate-file";

export const logger = winston.createLogger({
    level: "info",
    format: winston.format.json(),
    transports: [
        new winston.transports.Console({})
    ]
});
// export const logger = winston.createLogger({
//     level: "info",
//     format: winston.format.combine(
//         winston.format.timestamp(),
//         winston.format.json()
//     ),
//     transports: [
//         // new winston.transports.Console({}),
//         new winston.transports.Console({
//             format: winston.format.combine(
//                 winston.format.colorize(),
//                 winston.format.simple(),
//             )
//         }),

//         new winston.transports.File({
//             filename: 'logs/error.log',
//             level: 'error'
//         }),

//         new winston.transports.File({
//             filename: 'logs/combined.log'
//         }),

//         // new DailyRotateFile({
//         //     filename: 'logs/application-%DATE%.log',
//         //     datePattern: 'YYYY-MM-DD',
//         //     maxSize: '20m',
//         //     maxFiles: '14d'
//         // })
//     ]
// })