'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { postJson } from '@/components/auth/AuthForm';
import { ReauthModal } from '@/components/admin/ReauthModal';
import { REAUTH_SCOPES } from '@/modules/authorization/permissions';

export type RoleRow = {
  code: string;
  name: string;
  assignedAt: string;
  expiresAt: string | null;
  expired: boolean;
};

type Props = {
  userId: string;
  roles: RoleRow[];
  availableRoles: Array<{ code: string; name: string }>;
  canManageRoles: boolean;
  canReadRoles: boolean;
  isSelf: boolean;
  history: Array<{
    id: string;
    action: string;
    result: string;
    reason: string | null;
    createdAt: string;
  }>;
};

export function AdminUserRoles({
  userId,
  roles,
  availableRoles,
  canManageRoles,
  canReadRoles,
  isSelf,
  history,
}: Props) {
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [roleCode, setRoleCode] = useState(availableRoles[0]?.code ?? 'CUSTOMER');
  const [expiresAt, setExpiresAt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<null | {
    mode: 'assign' | 'revoke';
    roleCode: string;
  }>(null);

  const roleHistory = useMemo(
    () =>
      history.filter(
        (h) => h.action.startsWith('admin.role.') || h.action.includes('role'),
      ),
    [history],
  );

  if (!canReadRoles && !canManageRoles) {
    return null;
  }

  async function runRoleChange(grantToken: string) {
    if (!pending) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const body = {
        reason,
        roleCode: pending.roleCode,
        grantToken,
        expiresAt:
          pending.mode === 'assign' && expiresAt
            ? new Date(expiresAt).toISOString()
            : null,
      };
      if (pending.mode === 'assign') {
        await postJson(`/api/admin/users/${userId}/roles`, body);
        setSuccess(`Rol ${pending.roleCode} asignado.`);
      } else {
        await fetch(`/api/admin/users/${userId}/roles`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify(body),
        }).then(async (response) => {
          const payload = await response.json();
          if (!response.ok) {
            throw new Error(
              payload?.error?.message ?? 'No fue posible completar la operación.',
            );
          }
        });
        setSuccess(`Rol ${pending.roleCode} retirado.`);
      }
      setPending(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="authCard" data-testid="admin-user-roles">
      <h3>Roles</h3>
      <table className="adminTable">
        <thead>
          <tr>
            <th>Rol</th>
            <th>Asignado</th>
            <th>Expira</th>
            <th>Estado</th>
            {canManageRoles ? <th /> : null}
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <tr key={role.code}>
              <td>
                {role.name} ({role.code})
              </td>
              <td>{role.assignedAt}</td>
              <td>{role.expiresAt ?? 'Sin vencimiento'}</td>
              <td>{role.expired ? 'Vencido' : 'Activo'}</td>
              {canManageRoles ? (
                <td>
                  <button
                    type="button"
                    disabled={busy || isSelf || reason.trim().length < 5}
                    data-testid={`revoke-role-${role.code}`}
                    onClick={() => {
                      if (isSelf) {
                        setError('No podés modificar tus propios roles.');
                        return;
                      }
                      setPending({ mode: 'revoke', roleCode: role.code });
                    }}
                  >
                    Retirar
                  </button>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>

      {canManageRoles ? (
        <>
          <p className="authSubtitle">
            Solo SUPERADMIN puede asignar o retirar roles. Requiere
            reautenticación (scope roles.manage).
          </p>
          {isSelf ? (
            <p className="authError" role="status">
              No podés elevar ni modificar tus propios privilegios desde aquí.
            </p>
          ) : (
            <>
              <label className="authField">
                <span>Razón administrativa</span>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  data-testid="role-reason"
                />
              </label>
              <label className="authField">
                <span>Rol a asignar</span>
                <select
                  value={roleCode}
                  onChange={(e) => setRoleCode(e.target.value)}
                  data-testid="role-select"
                >
                  {availableRoles.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.name} ({r.code})
                    </option>
                  ))}
                </select>
              </label>
              <label className="authField">
                <span>Expiración opcional</span>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </label>
              <button
                type="button"
                className="authSubmit"
                disabled={busy || reason.trim().length < 5}
                data-testid="assign-role"
                onClick={() => setPending({ mode: 'assign', roleCode })}
              >
                Asignar rol
              </button>
            </>
          )}
        </>
      ) : (
        <p className="authSubtitle">Solo lectura de roles (roles.read).</p>
      )}

      {error ? (
        <p className="authError" role="alert" aria-live="polite">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="authOk" role="status" aria-live="polite">
          {success}
        </p>
      ) : null}

      <h4>Historial de cambios de rol</h4>
      <ul>
        {roleHistory.length === 0 ? <li>Sin cambios registrados.</li> : null}
        {roleHistory.map((h) => (
          <li key={h.id}>
            {h.createdAt} — {h.action} — {h.result}
            {h.reason ? ` — ${h.reason}` : ''}
          </li>
        ))}
      </ul>

      <ReauthModal
        open={Boolean(pending)}
        scope={REAUTH_SCOPES.ROLES_MANAGE}
        title="Reautenticación para gestionar roles"
        onCancel={() => {
          if (!busy) setPending(null);
        }}
        onGranted={runRoleChange}
      />
    </section>
  );
}
