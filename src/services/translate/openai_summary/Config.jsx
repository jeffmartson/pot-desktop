import { Input, Button, Switch, Textarea } from '@nextui-org/react';
import { DropdownTrigger } from '@nextui-org/react';
import { MdDeleteOutline } from 'react-icons/md';
import { DropdownMenu } from '@nextui-org/react';
import { DropdownItem } from '@nextui-org/react';
import toast, { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Dropdown } from '@nextui-org/react';
import { open } from '@tauri-apps/api/shell';
import React, { useState } from 'react';

import { useConfig } from '../../../hooks/useConfig';
import { useToastStyle } from '../../../hooks';
import { translate } from './index';
import { Language } from './index';

export function Config(props) {
    const { updateServiceList, onClose } = props;
    const [openaiConfig, setOpenaiConfig] = useConfig(
        'openai_summary',
        {
            service: 'openai',
            requestPath: 'https://api.openai.com/v1/chat/completions',
            model: 'gpt-3.5-turbo',
            apiKey: '',
            stream: false,
            promptList: [
                {
                    role: 'system',
                    content: 'You are a text summarizer, you can only summarize the text, never interpret it.',
                },
                { role: 'user', content: `Summarize in $detect:\n"""\n$text\n"""` },
            ],
        },
        { sync: false }
    );
    // 兼容旧版本
    if (openaiConfig) {
        if (openaiConfig.promptList === undefined) {
            setOpenaiConfig({
                ...openaiConfig,
                promptList: [
                    {
                        role: 'system',
                        content: 'You are a text summarizer, you can only summarize the text, never interpret it.',
                    },
                    { role: 'user', content: `Summarize in $detect:\n"""\n$text\n"""` },
                ],
            });
        }
    }
    const [isLoading, setIsLoading] = useState(false);

    const { t } = useTranslation();
    const toastStyle = useToastStyle();

    return (
        openaiConfig !== null && (
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    setIsLoading(true);
                    translate('hello', Language.auto, Language.zh_cn, { config: openaiConfig }).then(
                        () => {
                            setIsLoading(false);
                            setOpenaiConfig(openaiConfig, true);
                            updateServiceList('openai_summary');
                            onClose();
                        },
                        (e) => {
                            setIsLoading(false);
                            toast.error(t('config.service.test_failed') + e.toString(), { style: toastStyle });
                        }
                    );
                }}
            >
                <Toaster />
                <div className='config-item'>
                    <h3 className='my-auto'>{t('services.help')}</h3>
                    <Button
                        onPress={() => {
                            open('https://pot-app.com/docs/tutorial/api/translate/openai');
                        }}
                    >
                        {t('services.help')}
                    </Button>
                </div>
                <div className='config-item'>
                    <h3 className='my-auto'>{t('services.translate.openai.service')}</h3>
                    <Dropdown>
                        <DropdownTrigger>
                            <Button variant='bordered'>{t(`services.translate.openai.${openaiConfig.service}`)}</Button>
                        </DropdownTrigger>
                        <DropdownMenu
                            autoFocus='first'
                            aria-label='service'
                            onAction={(key) => {
                                setOpenaiConfig({
                                    ...openaiConfig,
                                    service: key,
                                });
                            }}
                        >
                            <DropdownItem key='openai'>{t(`services.translate.openai.openai`)}</DropdownItem>
                            <DropdownItem key='azure'>{t(`services.translate.openai.azure`)}</DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                </div>
                <div className='config-item'>
                    <Switch
                        isSelected={openaiConfig['stream']}
                        onValueChange={(value) => {
                            setOpenaiConfig({
                                ...openaiConfig,
                                stream: value,
                            });
                        }}
                        classNames={{
                            base: 'flex flex-row-reverse justify-between w-full max-w-full',
                        }}
                    >
                        {t('services.translate.openai.stream')}
                    </Switch>
                </div>
                <div className='config-item'>
                    <Input
                        label={t('services.translate.openai.request_path')}
                        labelPlacement='outside-left'
                        value={openaiConfig['requestPath']}
                        variant='bordered'
                        classNames={{
                            base: 'justify-between',
                            label: 'text-[length:--nextui-font-size-medium]',
                            mainWrapper: 'max-w-[50%]',
                        }}
                        onValueChange={(value) => {
                            setOpenaiConfig({
                                ...openaiConfig,
                                requestPath: value,
                            });
                        }}
                    />
                </div>
                <div className='config-item'>
                    <Input
                        label={t('services.translate.openai.api_key')}
                        labelPlacement='outside-left'
                        type='password'
                        value={openaiConfig['apiKey']}
                        variant='bordered'
                        classNames={{
                            base: 'justify-between',
                            label: 'text-[length:--nextui-font-size-medium]',
                            mainWrapper: 'max-w-[50%]',
                        }}
                        onValueChange={(value) => {
                            setOpenaiConfig({
                                ...openaiConfig,
                                apiKey: value,
                            });
                        }}
                    />
                </div>
                <div className={`config-item ${openaiConfig.service === 'azure' && 'hidden'}`}>
                    <h3 className='my-auto'>{t('services.translate.openai.model')}</h3>
                    <Dropdown>
                        <DropdownTrigger>
                            <Button variant='bordered'>{openaiConfig.model}</Button>
                        </DropdownTrigger>
                        <DropdownMenu
                            autoFocus='first'
                            aria-label='service'
                            onAction={(key) => {
                                setOpenaiConfig({
                                    ...openaiConfig,
                                    model: key,
                                });
                            }}
                        >
                            <DropdownItem key='gpt-3.5-turbo'>gpt-3.5-turbo</DropdownItem>
                            <DropdownItem key='gpt-3.5-turbo-16k'>gpt-3.5-turbo-16k</DropdownItem>
                            <DropdownItem key='gpt-4'>gpt-4</DropdownItem>
                            <DropdownItem key='gpt-4-32k'>gpt-4-32k</DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                </div>
                <h3 className='my-auto'>Prompt List</h3>
                <p className='text-[10px] text-default-700'>{t('services.translate.openai.prompt_description')}</p>

                <div className='bg-content2 rounded-[10px] p-3'>
                    {openaiConfig.promptList &&
                        openaiConfig.promptList.map((prompt, index) => {
                            return (
                                <div className='config-item'>
                                    <Textarea
                                        label={prompt.role}
                                        labelPlacement='outside'
                                        variant='faded'
                                        value={prompt.content}
                                        placeholder={`Input Some ${prompt.role} Prompt`}
                                        onValueChange={(value) => {
                                            setOpenaiConfig({
                                                ...openaiConfig,
                                                promptList: openaiConfig.promptList.map((p, i) => {
                                                    if (i === index) {
                                                        if (i === 0) {
                                                            return {
                                                                role: 'system',
                                                                content: value,
                                                            };
                                                        } else {
                                                            return {
                                                                role: index % 2 !== 0 ? 'user' : 'assistant',
                                                                content: value,
                                                            };
                                                        }
                                                    } else {
                                                        return p;
                                                    }
                                                }),
                                            });
                                        }}
                                    />
                                    <Button
                                        isIconOnly
                                        color='danger'
                                        className='my-auto mx-1'
                                        variant='flat'
                                        onPress={() => {
                                            setOpenaiConfig({
                                                ...openaiConfig,
                                                promptList: openaiConfig.promptList.filter((_, i) => i !== index),
                                            });
                                        }}
                                    >
                                        <MdDeleteOutline className='text-[18px]' />
                                    </Button>
                                </div>
                            );
                        })}
                    <Button
                        fullWidth
                        onPress={() => {
                            setOpenaiConfig({
                                ...openaiConfig,
                                promptList: [
                                    ...openaiConfig.promptList,
                                    {
                                        role:
                                            openaiConfig.promptList.length === 0
                                                ? 'system'
                                                : openaiConfig.promptList.length % 2 === 0
                                                ? 'assistant'
                                                : 'user',
                                        content: '',
                                    },
                                ],
                            });
                        }}
                    >
                        {t('services.translate.openai.add')}
                    </Button>
                </div>
                <br />
                <Button
                    type='submit'
                    isLoading={isLoading}
                    fullWidth
                    color='primary'
                >
                    {t('common.save')}
                </Button>
            </form>
        )
    );
}
