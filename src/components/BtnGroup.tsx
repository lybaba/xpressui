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
import { isObject } from "lodash";

type OwnProps = {
    formProps?: FormRenderProps<any, any>;
    footerConfig: TFooterConfig;
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
            {...(isObject(footerConfig.footer.cClasses) ? footerConfig.footer.cClasses : {})}
            {...(isObject(footerConfig.footer.cSxProps) ? footerConfig.footer.cSxProps : {})}
        >
            <Box
                component={'p'}
                {...(isObject(footerConfig.footer.lClasses) ? footerConfig.footer.lClasses : {})}
                {...(isObject(footerConfig.footer.lSxProps) ? footerConfig.footer.lSxProps : {})}
            >
                { footerConfig.footer.desc }
            </Box>
            <Stack
                component={ButtonGroup}
                gap={2}
                direction={'row'}
                justifyContent={'space-between'}
                spacing="1.25rem"
                {...(isObject(footerConfig.footer.iClasses) ? footerConfig.footer.iClasses : {})}
                {...(isObject(footerConfig.footer.iSxProps) ? footerConfig.footer.iSxProps : {})}
            >
                {
                    isMultiStepForm ? (
                        <Box
                            {...(isObject(footerConfig.prevBtn.cClasses) ? footerConfig.prevBtn.cClasses : {})}
                            {...(isObject(footerConfig.prevBtn.cSxProps) ? footerConfig.prevBtn.cSxProps : {})}
                        >
                            <Button
                                onClick={(e) => {
                                    e.preventDefault();
                                    onPrevBtnClick(postUIContext, props, formProps)
                                }}
                                disabled={!showPrevBtn}
                                {...(isObject(footerConfig.prevBtn.iClasses) ? footerConfig.prevBtn.iClasses : {})}
                                {...(isObject(footerConfig.prevBtn.iSxProps) ? footerConfig.prevBtn.iSxProps : {})}
                            >
                                <span
                                    {...(isObject(footerConfig.prevBtn.lClasses) ? footerConfig.prevBtn.lClasses : {})}
                                    {...(isObject(footerConfig.prevBtn.lSxProps) ? footerConfig.prevBtn.lSxProps : {})}
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
                            {...(isObject(footerConfig.nextBtn.cClasses) ? footerConfig.nextBtn.cClasses : {})}
                            {...(isObject(footerConfig.nextBtn.cSxProps) ? footerConfig.nextBtn.cSxProps : {})}
                        >
                            <Button
                                color="primary"
                                onClick={(e) => {
                                    e.preventDefault();
                                    onNextBtnClick(postUIContext, props, formProps)
                                }}
                                disabled={!showPrevBtn}
                                {...(isObject(footerConfig.nextBtn.iClasses) ? footerConfig.nextBtn.iClasses : {})}
                                {...(isObject(footerConfig.nextBtn.iSxProps) ? footerConfig.nextBtn.iSxProps : {})}
                            >
                                <span
                                    {...(isObject(footerConfig.nextBtn.lClasses) ? footerConfig.nextBtn.lClasses : {})}
                                    {...(isObject(footerConfig.nextBtn.lSxProps) ? footerConfig.nextBtn.lSxProps : {})}
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
                            {...(isObject(footerConfig.submitBtn.cClasses) ? footerConfig.submitBtn.cClasses : {})}
                            {...(isObject(footerConfig.submitBtn.cSxProps) ? footerConfig.submitBtn.cSxProps : {})}
                        >
                            <Button
                                type="submit"
                                color="primary"
                                variant="solid"
                                {...(isObject(footerConfig.submitBtn.iClasses) ? footerConfig.submitBtn.iClasses : {})}
                                {...(isObject(footerConfig.submitBtn.iSxProps) ? footerConfig.submitBtn.iSxProps : {})}
                            >
                                <span
                                    {...(isObject(footerConfig.submitBtn.lClasses) ? footerConfig.submitBtn.lClasses : {})}
                                    {...(isObject(footerConfig.submitBtn.lSxProps) ? footerConfig.submitBtn.lSxProps : {})}
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