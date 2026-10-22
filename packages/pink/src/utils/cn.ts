/**
 * Joins class values (strings, arrays, `{ className: condition }` maps) into
 * one class string, dropping falsy entries. Pink's single class-composition
 * entry point; components import this, never the backing library.
 */
export { clsx as cn, type ClassValue } from 'clsx';
