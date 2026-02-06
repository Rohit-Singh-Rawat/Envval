'use client';

import * as React from 'react';
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogFooter,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogCancel,
	AlertDialogAction,
} from '@envval/ui/components/alert-dialog';
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from '@envval/ui/components/drawer';
import { useIsMobile } from '@envval/ui/hooks/use-mobile';

type ResponsiveAlertProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	children: React.ReactNode;
};

type ResponsiveAlertContentProps = {
	children: React.ReactNode;
	className?: string;
};

type ResponsiveAlertHeaderProps = {
	children: React.ReactNode;
	className?: string;
};

type ResponsiveAlertFooterProps = {
	children: React.ReactNode;
	className?: string;
};

type ResponsiveAlertTitleProps = {
	children: React.ReactNode;
	className?: string;
};

type ResponsiveAlertDescriptionProps = {
	children: React.ReactNode;
	className?: string;
};

const ResponsiveAlertContext = React.createContext<{ isMobile: boolean }>({ isMobile: false });

/**
 * Responsive wrapper that uses AlertDialog on desktop and Drawer on mobile
 */
export function ResponsiveAlert({ open, onOpenChange, children }: ResponsiveAlertProps) {
	const isMobile = useIsMobile();

	return (
		<ResponsiveAlertContext.Provider value={{ isMobile }}>
			{isMobile ? (
				<Drawer open={open} onOpenChange={onOpenChange}>
					{children}
				</Drawer>
			) : (
				<AlertDialog open={open} onOpenChange={onOpenChange}>
					{children}
				</AlertDialog>
			)}
		</ResponsiveAlertContext.Provider>
	);
}

export function ResponsiveAlertContent({ children, className }: ResponsiveAlertContentProps) {
	const { isMobile } = React.useContext(ResponsiveAlertContext);

	if (isMobile) {
		return <DrawerContent className={className}>{children}</DrawerContent>;
	}

	return <AlertDialogContent className={className}>{children}</AlertDialogContent>;
}

export function ResponsiveAlertHeader({ children, className }: ResponsiveAlertHeaderProps) {
	const { isMobile } = React.useContext(ResponsiveAlertContext);

	if (isMobile) {
		return <DrawerHeader className={className}>{children}</DrawerHeader>;
	}

	return <AlertDialogHeader className={className}>{children}</AlertDialogHeader>;
}

export function ResponsiveAlertFooter({ children, className }: ResponsiveAlertFooterProps) {
	const { isMobile } = React.useContext(ResponsiveAlertContext);

	if (isMobile) {
		return <DrawerFooter className={className}>{children}</DrawerFooter>;
	}

	return <AlertDialogFooter className={className}>{children}</AlertDialogFooter>;
}

export function ResponsiveAlertTitle({ children, className }: ResponsiveAlertTitleProps) {
	const { isMobile } = React.useContext(ResponsiveAlertContext);

	if (isMobile) {
		return <DrawerTitle className={className}>{children}</DrawerTitle>;
	}

	return <AlertDialogTitle className={className}>{children}</AlertDialogTitle>;
}

export function ResponsiveAlertDescription({ children, className }: ResponsiveAlertDescriptionProps) {
	const { isMobile } = React.useContext(ResponsiveAlertContext);

	if (isMobile) {
		return <DrawerDescription className={className}>{children}</DrawerDescription>;
	}

	return <AlertDialogDescription className={className}>{children}</AlertDialogDescription>;
}

/**
 * Cancel button - works for both AlertDialog and Drawer
 */
export function ResponsiveAlertCancel({ 
	children, 
	className,
	...props 
}: React.ComponentProps<'button'> & { className?: string }) {
	const { isMobile } = React.useContext(ResponsiveAlertContext);

	if (isMobile) {
		return (
			<DrawerClose className={className} {...props}>
				{children}
			</DrawerClose>
		);
	}

	return (
		<AlertDialogCancel className={className} {...props}>
			{children}
		</AlertDialogCancel>
	);
}

/**
 * Action button - works for both AlertDialog and Drawer
 * On mobile, just renders the children (expects a Button component)
 */
export function ResponsiveAlertAction({ 
	children,
	className,
	...props
}: React.ComponentProps<'button'> & { className?: string }) {
	const { isMobile } = React.useContext(ResponsiveAlertContext);

	if (isMobile) {
		// On mobile (drawer), just render the button as-is
		return <div className={className}>{children}</div>;
	}

	return (
		<AlertDialogAction className={className} {...props}>
			{children}
		</AlertDialogAction>
	);
}
