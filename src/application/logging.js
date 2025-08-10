import winston from "winston";
// import DailyRotateFile from "winston-daily-rotate-file";

export const logger = winston.createLogger({
    level: "info",
    format: winston.format.json(),
    transports: [
        // new winston.transports.Console({})
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                winston.format.printf(({ timestamp, level, message, ...meta }) => {
                    let output = `[${timestamp}] ${level.toUpperCase()}: `;

                    // Handle message
                    if (typeof message === 'object') {
                        output += '\n' + JSON.stringify(message, null, 2);
                    } else {
                        output += message;
                    }

                    // Handle additional metadata
                    if (Object.keys(meta).length > 0) {
                        output += '\n' + JSON.stringify(meta, null, 2);
                    }

                    return output;
                })
            )
        }),
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