import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import Button from '@cloudscape-design/components/button';

import {
    Box,
    ColumnLayout,
    Container,
    ContentLayout,
    DetailsHeader,
    Header,
    Loader,
    StatusIndicator,
    TabsProps,
} from 'components';

import { DATE_TIME_FORMAT } from 'consts';
import { useBreadcrumbs, useNotifications } from 'hooks';
import { getRepoDisplayName } from 'libs/repo';
import { getStatusIconType } from 'libs/run';
import { ROUTES } from 'routes';
import { useGetProjectRepoQuery } from 'services/project';
import { useDeleteRunsMutation, useGetRunQuery, useStopRunsMutation } from 'services/run';

import { isAvailableAbortingForRun, isAvailableDeletingForRun, isAvailableStoppingForRun } from '../utils';

import styles from './styles.module.scss';

export const RunDetails: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const params = useParams();
    const paramProjectName = params.name ?? '';
    const paramRepoId = params.repoId ?? '';
    const paramRunName = params.runName ?? '';
    const [pushNotification] = useNotifications();

    const { data: repoData } = useGetProjectRepoQuery({
        name: paramProjectName,
        repo_id: paramRepoId,
    });

    const { data: runData, isLoading: isLoadingRun } = useGetRunQuery({
        name: paramProjectName,
        repo_id: paramRepoId,
        run_name: paramRunName,
    });

    const [stopRun, { isLoading: isStopping }] = useStopRunsMutation();
    const [deleteRun, { isLoading: isDeleting }] = useDeleteRunsMutation();

    const displayRepoName = repoData ? getRepoDisplayName(repoData) : 'Loading...';

    useBreadcrumbs([
        {
            text: t('navigation.projects'),
            href: ROUTES.PROJECT.LIST,
        },
        {
            text: paramProjectName,
            href: ROUTES.PROJECT.DETAILS.REPOSITORIES.FORMAT(paramProjectName),
        },
        {
            text: t('projects.repositories'),
            href: ROUTES.PROJECT.DETAILS.REPOSITORIES.FORMAT(paramProjectName),
        },
        {
            text: displayRepoName,
            href: ROUTES.PROJECT.DETAILS.REPOSITORIES.DETAILS.FORMAT(paramProjectName, paramRepoId),
        },
        {
            text: t('projects.runs'),
            href: ROUTES.PROJECT.DETAILS.REPOSITORIES.DETAILS.FORMAT(paramProjectName, paramRepoId),
        },
        {
            text: paramRunName,
            href: ROUTES.PROJECT.DETAILS.RUNS.DETAILS.FORMAT(paramProjectName, paramRepoId, paramRunName),
        },
    ]);

    const abortClickHandle = () => {
        stopRun({
            name: paramProjectName,
            repo_id: paramRepoId,
            run_names: [paramRunName],
            abort: true,
        })
            .unwrap()
            .catch((error) => {
                pushNotification({
                    type: 'error',
                    content: t('common.server_error', { error: error?.error }),
                });
            });
    };

    const stopClickHandle = () => {
        stopRun({
            name: paramProjectName,
            repo_id: paramRepoId,
            run_names: [paramRunName],
            abort: false,
        })
            .unwrap()
            .catch((error) => {
                pushNotification({
                    type: 'error',
                    content: t('common.server_error', { error: error?.error }),
                });
            });
    };

    const deleteClickHandle = () => {
        deleteRun({
            name: paramProjectName,
            repo_id: paramRepoId,
            run_names: [paramRunName],
        })
            .unwrap()
            .then(() => {
                navigate(ROUTES.PROJECT.DETAILS.REPOSITORIES.DETAILS.FORMAT(paramProjectName, paramRepoId));
            })
            .catch((error) => {
                pushNotification({
                    type: 'error',
                    content: t('common.server_error', { error: error?.error }),
                });
            });
    };

    const isDisabledAbortButton = !runData || !isAvailableAbortingForRun(runData.run_head.status) || isStopping || isDeleting;
    const isDisabledStopButton = !runData || !isAvailableStoppingForRun(runData.run_head.status) || isStopping || isDeleting;
    const isDisabledDeleteButton = !runData || !isAvailableDeletingForRun(runData.run_head.status) || isStopping || isDeleting;

    return (
        <div className={styles.page}>
            <ContentLayout
                header={
                    <DetailsHeader
                        title={paramRunName}
                        actionButtons={
                            <>
                                <Button onClick={abortClickHandle} disabled={isDisabledAbortButton}>
                                    {t('common.abort')}
                                </Button>

                                <Button onClick={stopClickHandle} disabled={isDisabledStopButton}>
                                    {t('common.stop')}
                                </Button>

                                <Button onClick={deleteClickHandle} disabled={isDisabledDeleteButton}>
                                    {t('common.delete')}
                                </Button>
                            </>
                        }
                    />
                }
            >
                {isLoadingRun && (
                    <Container>
                        <Loader />
                    </Container>
                )}

                {runData && (
                    <Container header={<Header variant="h2">{t('common.general')}</Header>}>
                        <ColumnLayout columns={4} variant="text-grid">
                            <div>
                                <Box variant="awsui-key-label">{t('projects.run.configuration')}</Box>
                                <div>{runData.run_head.job_heads?.[0].configuration_path}</div>
                            </div>

                            <div>
                                <Box variant="awsui-key-label">{t('projects.run.instance')}</Box>
                                <div>{runData.run_head.job_heads?.[0].instance_type}</div>
                            </div>

                            <div>
                                <Box variant="awsui-key-label">{t('projects.run.hub_user_name')}</Box>
                                <div>{runData.run_head.hub_user_name}</div>
                            </div>

                            <div>
                                <Box variant="awsui-key-label">{t('projects.run.status')}</Box>
                                <div>
                                    <StatusIndicator type={getStatusIconType(runData.run_head.status)}>
                                        {t(`projects.run.statuses.${runData.run_head.status}`)}
                                    </StatusIndicator>
                                </div>
                            </div>

                            <div>
                                <Box variant="awsui-key-label">{t('projects.run.submitted_at')}</Box>
                                <div>{format(new Date(runData.run_head.submitted_at), DATE_TIME_FORMAT)}</div>
                            </div>

                            {runData.run_head.job_heads?.[0].error_code && (
                                <div>
                                    <Box variant="awsui-key-label">{t('projects.run.error')}</Box>
                                    <div>{runData.run_head.job_heads?.[0].error_code}</div>
                                </div>
                            )}
                        </ColumnLayout>
                    </Container>
                )}

                <Outlet />
            </ContentLayout>
        </div>
    );
};
