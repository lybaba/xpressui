import TPostUIProps from '../../../common/TPostUIProps';
import { Box, Link, Stack } from '@mui/joy';
import TFieldConfig, { TCssProps } from '../../../common/TFieldConfig';
import { DialogTitle, Drawer, IconButton, ModalClose } from '@mui/joy';
import { MenuRounded } from '@mui/icons-material';
import { useState } from 'react';
import { getCssProps } from '../../../common/field';
import { getSectionFields } from '../../../common/post';

type HeaderMenuOwnProps = {
    headerMenuConfig: TFieldConfig;
}

type MenuItemOwnProps = {
    fieldConfig: TFieldConfig;
    fieldIndex: number;
}

type MenuItemProps = MenuItemOwnProps & TPostUIProps;

function MenuItem(props: MenuItemProps) {
    const {
        fieldConfig
    } = props;

    return (
        <Box
            component={'li'}
        >
            <Link
                href="#"
            >
                {
                    fieldConfig.label
                }
            </Link>
        </Box>
    )
}

type MenuListOwnProps = {
    fields: TFieldConfig[];
    cssProps: TCssProps
}

type MenuListProps = MenuListOwnProps & TPostUIProps;

export function MenuList(props: MenuListProps) {
    const {
        fields
    } = props;

    return fields.map((fieldConfig, index) => (
        <MenuItem
            key={index}
            {...props}
            fieldConfig={fieldConfig}
            fieldIndex={index}
        />
    ))
}

type HeaderMenuProps = HeaderMenuOwnProps & TPostUIProps;

export default function HeaderMenu(props: HeaderMenuProps) {
    const [open, setOpen] = useState(false);

    const {
        formConfig,
        headerMenuConfig
    } = props;
    
    const cssProps = getCssProps(headerMenuConfig);
    const fields = getSectionFields(formConfig, headerMenuConfig.name);

    return (
        <Box
            component={'nav'}
        >
            <Stack
                component={'ul'}
                direction="row"
                justifyContent="center"
                alignItems="center"
                spacing={1}
                gap={2}
                sx={{ mx: 3, display: { xs: 'none', sm: 'flex' } }}
                className='header-nav'
                {...cssProps.blockClasses}
                {...cssProps.blockProps}
            >
                <MenuList {...props}  cssProps={cssProps} fields={fields} />
            </Stack>
            <Box sx={{ display: { xs: 'inline-flex', sm: 'none' } }}>
                <IconButton variant="plain" color="neutral" onClick={() => setOpen(true)}>
                    <MenuRounded />
                </IconButton>
                <Drawer
                    sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
                    open={open}
                    onClose={() => setOpen(false)}
                >
                    <ModalClose />
                    <DialogTitle>{formConfig.label}</DialogTitle>
                    <Stack
                        component={'ul'}
                        spacing={1}
                        gap={2}
                        sx={{
                            p: 2,
                            display: { xs: 'inline-flex', sm: 'none' }
                        }}
                        className='header-nav-drawer'
                        {...cssProps.blockClasses}
                        {...cssProps.blockProps}
                    >
                        <MenuList {...props} cssProps={cssProps} fields={fields} />
                    </Stack>
                </Drawer>
            </Box>
        </Box>
    )
}
