import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useSearchParams } from 'react-router-dom';

import AppLayout from 'layouts/AppLayout';

import { useAppDispatch, useAppSelector } from 'hooks';
import { useGetUserDataQuery } from 'services/user';

import { AuthErrorMessage } from './AuthErrorMessage';
import { Loading } from './Loading';
import { selectAuthToken, setAuthData, setUserData } from './slice';

const localStorageIsAvailable = 'localStorage' in window;

const App: React.FC = () => {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const urlToken = searchParams.get('token');
    const token = useAppSelector(selectAuthToken);
    const isAuthenticated = Boolean(token);
    const [isAuthorizing, setIsAuthorizing] = useState(localStorageIsAvailable);
    const dispatch = useAppDispatch();

    const {
        isLoading,
        data: userData,
        error: getUserError,
    } = useGetUserDataQuery(
        { token },
        {
            skip: !isAuthenticated || !!urlToken || !localStorageIsAvailable,
        },
    );

    useEffect(() => {
        if (!isAuthenticated && !urlToken) {
            setIsAuthorizing(false);
        }

        if (urlToken) {
            dispatch(setAuthData({ token: urlToken as string }));
            setSearchParams();
        }
    }, []);

    useEffect(() => {
        if (userData?.username || getUserError) {
            setIsAuthorizing(false);

            if (userData?.username) {
                dispatch(setUserData(userData));
            }
        }
    }, [userData, getUserError, isLoading]);

    const renderLocalstorageError = () => {
        return (
            <AuthErrorMessage
                title={t('common.local_storage_unavailable')}
                text={t('common.local_storage_unavailable_message')}
            />
        );
    };

    const renderTokenError = () => {
        return <AuthErrorMessage showLoginForm title={t('auth.invalid_token')} text={t('auth.contact_to_administrator')} />;
    };

    const renderNotAuthorizedError = () => {
        return (
            <AuthErrorMessage showLoginForm title={t('auth.you_are_not_logged_in')} text={t('auth.contact_to_administrator')} />
        );
    };

    if (isAuthorizing) return <Loading />;

    if (!localStorageIsAvailable) return renderLocalstorageError();
    if (getUserError) return renderTokenError();
    if (!isAuthenticated && !urlToken) return renderNotAuthorizedError();

    return (
        <AppLayout>
            <Outlet />
        </AppLayout>
    );
};

export default App;
