// Declaración ambiental para la peer dependency OPCIONAL 'cuba-geodata'.
// Permite `await import('cuba-geodata')` sin instalarla: si no está
// instalada, el import dinámico rechaza en runtime y el formulario
// usa inputs de texto. No importar estáticamente desde el core.
declare module 'cuba-geodata'
