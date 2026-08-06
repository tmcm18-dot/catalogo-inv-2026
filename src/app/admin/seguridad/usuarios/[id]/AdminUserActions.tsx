'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { postJson } from '@/components/auth/AuthForm';
import { ReauthModal } from '@/components/admin/ReauthModal';
import {
  REAUTH_SCOPES,
  type ReauthScope,
} from '@/modules/authorization/permissions';

type Props = {
  userId: string;
  status: string;
  targetRoles: string[];
  actorPermissions: string[];
  isSelf: boolean;
};

type PendingAction = {
  path: string;
  method?: 'POST';
  body: Record<string, unknown>;
  scope: ReauthScope | null;
  label: string;
};

function isPrivileged(roles: string[]) {
  return roles.includes('ADMIN') || roles.includes('SUPERADMIN');
}

export function AdminUserActions({
  userId,
  status,
  targetRoles,
  actorPermissions,
  isSelf,
}: Props) {
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<PendingAction | null>(null);

  const canSuspend = actorPermissions.includes('users.suspend');
  const canManage = actorPermissions.includes('users.manage');
  const canRevokeSessions = actorPermissions.includes('sessions.revoke');
  const targetIsPrivileged = isPrivileged(targetRoles);

  const reasonOk = reason.trim().length >= 5;

  async function executeWithOptionalGrant(
    action: PendingAction,
    grantToken?: string,
  ) {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await postJson(action.path, {
        ...action.body,
        ...(grantToken ? { grantToken } : {}),
      });
      setSuccess(`${action.label} completada.`);
      setPending(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  function queueAction(action: PendingAction) {
    setError(null);
    setSuccess(null);
    if (!reasonOk) {
      setError('Ingresá una razón administrativa (mínimo 5 caracteres).');
      return;
    }
    if (action.scope) {
      setPending(action);
      return;
    }
    void executeWithOptionalGrant(action);
  }

  const actions = useMemo(() => {
    const list: Array<{
      key: string;
      label: string;
      visible: boolean;
      enabled: boolean;
      onClick: () => void;
    }> = [];

    if (status === 'PENDING_VERIFICATION' && canManage && !isSelf) {
      list.push({
        key: 'activate',
        label: 'Activar',
        visible: true,
        enabled: reasonOk && !busy,
        onClick: () =>
          queueAction({
            path: `/api/admin/users/${userId}/activate`,
            body: { reason },
            scope: null,
            label: 'Activación',
          }),
      });
    }

    if (status !== 'SUSPENDED' && canSuspend && !isSelf) {
      list.push({
        key: 'suspend',
        label: 'Suspender',
        visible: true,
        enabled: reasonOk && !busy,
        onClick: () =>
          queueAction({
            path: `/api/admin/users/${userId}/suspend`,
            body: { reason },
            scope: targetIsPrivileged ? REAUTH_SCOPES.USERS_SUSPEND_ADMIN : null,
            label: 'Suspensión',
          }),
      });
    }

    if (status === 'SUSPENDED' && canSuspend && !isSelf) {
      list.push({
        key: 'reactivate',
        label: 'Reactivar',
        visible: true,
        enabled: reasonOk && !busy,
        onClick: () =>
          queueAction({
            path: `/api/admin/users/${userId}/reactivate`,
            body: { reason },
            scope: null,
            label: 'Reactivación',
          }),
      });
    }

    if (canManage && !isSelf && status !== 'SUSPENDED') {
      list.push({
        key: 'block',
        label: 'Bloqueo temporal 15m',
        visible: true,
        enabled: reasonOk && !busy,
        onClick: () =>
          queueAction({
            path: `/api/admin/users/${userId}/block`,
            body: { reason, minutes: 15 },
            scope: targetIsPrivileged ? REAUTH_SCOPES.USERS_SUSPEND_ADMIN : null,
            label: 'Bloqueo temporal',
          }),
      });
    }

    if (canRevokeSessions) {
      list.push({
        key: 'revoke-all',
        label: 'Cerrar todas las sesiones',
        visible: true,
        enabled: reasonOk && !busy,
        onClick: () =>
          queueAction({
            path: `/api/admin/users/${userId}/sessions/revoke-all`,
            body: { reason },
            scope:
              targetIsPrivileged && !isSelf
                ? REAUTH_SCOPES.SESSIONS_REVOKE_ADMIN
                : null,
            label: 'Revocación de sesiones',
          }),
      });
    }

    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    status,
    canManage,
    canSuspend,
    canRevokeSessions,
    isSelf,
    reasonOk,
    busy,
    reason,
    userId,
    targetIsPrivileged,
  ]);

  if (actions.length === 0) {
    return (
      <section className="authCard">
        <h3>Acciones</h3>
        <p>No tenés permisos para acciones sobre este usuario, o no aplican.</p>
      </section>
    );
  }

  return (
    <section className="authCard">
      <h3>Acciones</h3>
      <p>
        Las acciones críticas requieren razón administrativa, permisos en
        servidor y reautenticación cuando el objetivo es administrador.
      </p>
      <label className="authField">
        <span>Razón administrativa</span>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={busy}
          data-testid="admin-reason"
        />
      </label>
      <div className="adminActionsRow">
        {actions.map((action) =>
          action.visible ? (
            <button
              key={action.key}
              type="button"
              disabled={!action.enabled}
              onClick={action.onClick}
              data-testid={`admin-action-${action.key}`}
              title={
                !reasonOk
                  ? 'Completá la razón administrativa primero'
                  : action.label
              }
            >
              {action.label}
            </button>
          ) : null,
        )}
      </div>
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

      <ReauthModal
        open={Boolean(pending?.scope)}
        scope={pending?.scope ?? REAUTH_SCOPES.USERS_SUSPEND_ADMIN}
        title="Reautenticación requerida"
        onCancel={() => {
          if (!busy) setPending(null);
        }}
        onGranted={async (grantToken) => {
          if (!pending) return;
          // Grant kept only in this async stack frame (memory).
          await executeWithOptionalGrant(pending, grantToken);
        }}
      />
    </section>
  );
}
