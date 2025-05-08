"use client";
import { Button, CloseButton, Drawer, useDisclosure } from "@chakra-ui/react";
import { useEffect, useState } from "react";

export default function WrongWallet() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Drawer.Root
                open={open}
                onOpenChange={(e) => setOpen(e.open)}
            >

                <Drawer.Content>
                    <Drawer.Header fontSize='lg' fontWeight='bold'>
                        Error.
                    </Drawer.Header>
                    <Drawer.CloseTrigger />
                    <Drawer.Body>
                        This wallet is not compatible<br />
                        with the new Wallet API.
                    </Drawer.Body>

                    <Drawer.Footer>
                        <Button colorScheme='red' ml={3}>
                            Understood
                        </Button>
                    </Drawer.Footer>
                    <Drawer.CloseTrigger asChild>
                        <CloseButton size="sm" />
                    </Drawer.CloseTrigger>
                </Drawer.Content>
            </Drawer.Root>
        </>
    );
}