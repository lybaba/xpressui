import { Box, Button, ButtonGroup, Stack } from "@mui/joy";

import {
    MAIN_SECTION,
} from '../common/Constants';
import { usePostUIContext } from "./ui/PostUIProvider";
import { FormRenderProps } from "react-final-form";
import { onNextBtnClick, onPrevBtnClick } from "./ui/Actions";
import { MULTI_STEP_FORM_TYPE } from "../common/TFormConfig";
import TPostUIProps from "../common/TPostUIProps";
import { TFooterConfig } from "../common/footer";
import { THeadingConfig } from "../common/heading";

type OwnProps = {
    formProps?: FormRenderProps<any, any>;
    footerConfig: TFooterConfig;
    headingConfig: THeadingConfig;
}

type Props = OwnProps & TPostUIProps;
function BtnGroup(props: Props) {
    const {
        formProps,
        formConfig,
        footerConfig
    } = props;

    const postUIContext = usePostUIContext();
    const {
        currentStepIndex,
    } = postUIContext

    const steps = formConfig.sections[MAIN_SECTION];
    const nbSteps = steps.length;

    const isMultiStepForm = formConfig.type === MULTI_STEP_FORM_TYPE;
    const currentStepNum = currentStepIndex + 1;

    const showNextBtn = isMultiStepForm && currentStepNum < nbSteps;

    const showPrevBtn = isMultiStepForm && currentStepNum > 1;

    const showSubmitBtn = !isMultiStepForm || currentStepNum === nbSteps;

    return (
        <Stack
            {...footerConfig.footer.cClassesProps}
            {...footerConfig.footer.cSxPropsProps}
        >
            <Box
                component={'p'}
                {...footerConfig.footer.lClassesProps}
                {...footerConfig.footer.lSxPropsProps}
            >
                { footerConfig.footer.desc }
            </Box>
            <Stack
                component={ButtonGroup}
                gap={2}
                direction={'row'}
                justifyContent={'space-between'}
                spacing="1.25rem"
                {...footerConfig.footer.iClassesProps}
                {...footerConfig.footer.iSxPropsProps}
            >
                {
                    isMultiStepForm ? (
                        <Box
                            {...footerConfig.prevBtn.cClassesProps}
                            {...footerConfig.prevBtn.cSxPropsProps}
                        >
                            <Button
                                onClick={(e) => {
                                    e.preventDefault();
                                    onPrevBtnClick(postUIContext, props, formProps)
                                }}
                                disabled={!showPrevBtn}
                                {...footerConfig.prevBtn.iClassesProps}
                                {...footerConfig.prevBtn.iSxPropsProps}
                            >
                                <span
                                    {...footerConfig.prevBtn.lClassesProps}
                                    {...footerConfig.prevBtn.lSxPropsProps}
                                >
                                    {
                                        footerConfig.prevBtn.label
                                    }
                                </span>
                            </Button>
                        </Box>
                    ) : null
                }
                {
                    isMultiStepForm && showNextBtn && (
                        <Box
                            {...footerConfig.nextBtn.cClassesProps}
                            {...footerConfig.nextBtn.cSxPropsProps}
                        >
                            <Button
                                color="primary"
                                onClick={(e) => {
                                    e.preventDefault();
                                    onNextBtnClick(postUIContext, props, formProps)
                                }}
                                {...footerConfig.nextBtn.iClassesProps}
                                {...footerConfig.nextBtn.iSxPropsProps}
                            >
                                <span
                                    {...footerConfig.nextBtn.lClassesProps}
                                    {...footerConfig.nextBtn.lSxPropsProps}
                                >
                                    {
                                        footerConfig.nextBtn.label
                                    }
                                </span>
                            </Button>
                        </Box>
                    )
                }
                {
                    showSubmitBtn && (
                        <Box
                            {...footerConfig.submitBtn.cClassesProps}
                            {...footerConfig.submitBtn.cSxPropsProps}
                        >
                            <Button
                                type="submit"
                                color="primary"
                                variant="solid"
                                {...footerConfig.submitBtn.iClassesProps}
                                {...footerConfig.submitBtn.iSxPropsProps}
                            >
                                <span
                                    {...footerConfig.submitBtn.lClassesProps}
                                    {...footerConfig.submitBtn.lSxPropsProps}
                                >
                                    {
                                        footerConfig.submitBtn.label
                                    }
                                </span>
                            </Button>
                        </Box>
                    )
                }
            </Stack>
        </Stack>
    );
}

export default BtnGroup;