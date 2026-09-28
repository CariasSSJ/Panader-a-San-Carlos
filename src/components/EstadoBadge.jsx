import React from 'react';

const ESTADOS = {
  PENDIENTE_REVISION: { label: 'Pendiente', backgroundColor: '#fef3c7', color: '#92400e' },
  PENDIENTE: { label: 'Pendiente', backgroundColor: '#fef3c7', color: '#92400e' },
  APROBADO: { label: 'Aprobado', backgroundColor: '#dcfce7', color: '#166534' },
  EN_PRODUCCION: { label: 'En producción', backgroundColor: '#dbeafe', color: '#1e40af' },
  PROCESADO: { label: 'Despachado', backgroundColor: '#ccfbf1', color: '#115e59' },
  DESPACHADO: { label: 'Despachado', backgroundColor: '#ccfbf1', color: '#115e59' }
};

export const EstadoBadge = ({ estado = 'PENDIENTE_REVISION' }) => {
  const configuracion = ESTADOS[estado] || { label: estado, backgroundColor: '#e2e8f0', color: '#334155' };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.35rem 0.65rem',
      borderRadius: '999px',
      backgroundColor: configuracion.backgroundColor,
      color: configuracion.color,
      fontSize: '0.75rem',
      fontWeight: '600',
      letterSpacing: '0.01em',
      lineHeight: 1,
      whiteSpace: 'nowrap'
    }}>
      {configuracion.label}
    </span>
  );
};