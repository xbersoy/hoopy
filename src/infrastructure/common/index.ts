// export * from './logger'

export const isDevelopment = () =>
	['local', 'dev', 'test'].includes(process.env.ENV)
