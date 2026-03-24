import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, CircleDot } from 'lucide-react';

const Survey = ({ question, options, onSubmit }) => {
    const [selectedOption, setSelectedOption] = useState(null);
    const [customResponse, setCustomResponse] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleOptionSelect = (index) => {
        setSelectedOption(index);
        setCustomResponse(''); // clear custom text when an option is picked
    };

    const handleCustomChange = (e) => {
        setCustomResponse(e.target.value);
        setSelectedOption(null); // deselect option when typing custom response
    };

    const handleSubmit = () => {
        const answer = selectedOption !== null
            ? options[selectedOption]
            : customResponse.trim();

        if (!answer) return;

        setSubmitted(true);

        if (onSubmit) {
            onSubmit({ question, answer, isCustom: selectedOption === null });
        }
    };

    const hasAnswer = selectedOption !== null || customResponse.trim().length > 0;

    if (submitted) {
        return (
            <Card className="max-w-xl mx-auto p-8 text-center border border-border bg-card shadow-lg animate-in fade-in-0 zoom-in-95 duration-300">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <CheckCircle2 className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">
                        Thank you for your response!
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Your feedback has been recorded.
                    </p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="max-w-xl mx-auto border border-border bg-card shadow-lg overflow-hidden">
            {/* Header accent bar */}
            <div className="h-1.5 bg-primary w-full" />

            <div className="p-6 space-y-6">
                {/* Question */}
                <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Survey Question
                    </p>
                    <h2 className="text-lg font-semibold text-foreground leading-snug">
                        {question}
                    </h2>
                </div>

                {/* Divider */}
                <hr className="border-border" />

                {/* Options */}
                <div className="space-y-3">
                    <Label className="text-sm font-medium text-foreground">
                        Choose an option
                    </Label>

                    <div className="space-y-2">
                        {options.map((option, index) => {
                            const isSelected = selectedOption === index;
                            return (
                                <button
                                    key={index}
                                    onClick={() => handleOptionSelect(index)}
                                    className={`
                                        w-full flex items-center gap-3 p-3 rounded-lg text-left
                                        transition-all duration-200 cursor-pointer
                                        border
                                        ${isSelected
                                            ? 'border-primary bg-primary/5 shadow-sm'
                                            : 'border-border bg-secondary/30 hover:border-primary/40 hover:bg-secondary/60'
                                        }
                                    `}
                                >
                                    <div
                                        className={`
                                            flex-shrink-0 h-5 w-5 rounded-full border-2
                                            flex items-center justify-center
                                            transition-colors duration-200
                                            ${isSelected
                                                ? 'border-primary bg-primary'
                                                : 'border-muted-foreground/40'
                                            }
                                        `}
                                    >
                                        {isSelected && (
                                            <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                                        )}
                                    </div>
                                    <span
                                        className={`text-sm ${
                                            isSelected
                                                ? 'text-foreground font-medium'
                                                : 'text-foreground/80'
                                        }`}
                                    >
                                        {option}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Divider with "or" */}
                <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground font-medium">OR</span>
                    <div className="flex-1 h-px bg-border" />
                </div>

                {/* Custom input */}
                <div className="space-y-2">
                    <Label
                        htmlFor="custom-response"
                        className="text-sm font-medium text-foreground"
                    >
                        Share your own opinion
                    </Label>
                    <Textarea
                        id="custom-response"
                        placeholder="Type your thoughts here..."
                        value={customResponse}
                        onChange={handleCustomChange}
                        rows={3}
                        className="resize-none bg-secondary/30 border-border focus:border-primary text-foreground placeholder:text-muted-foreground"
                    />
                </div>

                {/* Submit */}
                <Button
                    onClick={handleSubmit}
                    disabled={!hasAnswer}
                    className="w-full transition-all duration-200"
                >
                    Submit Response
                </Button>
            </div>
        </Card>
    );
};

export default Survey;
