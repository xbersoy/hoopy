// export * from './logger'

export const isDevelopment = () =>
	['local', 'dev', 'test', 'staging'].includes(process.env.ENV)
