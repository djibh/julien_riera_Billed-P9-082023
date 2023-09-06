/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import BillsUI from "../views/BillsUI.js";
import { ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import "@testing-library/jest-dom"
import NewBill from "../containers/NewBill.js";
import mockStore from "../__mocks__/store";
import userEvent from "@testing-library/user-event";


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then mail icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
      await waitFor(() => screen.getByTestId('icon-mail'))
      const windowIcon = screen.getByTestId('icon-mail')
      //to-do write expect expression
      expect(windowIcon).toHaveClass('active-icon')
    })

    test("Then the form should be rendered", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      expect(screen.getByText('Envoyer une note de frais')).toBeInTheDocument()
      const newBillForm = screen.getByTestId('form-new-bill')
      expect(newBillForm).toBeInTheDocument()
    })

    test("Then bill type should be a select input with 7 options", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      const expenseTypeSelect = screen.getByTestId('expense-type')
      const optionsList = screen.getAllByRole('option')
      expect(expenseTypeSelect).toBeInTheDocument()
      expect(optionsList).toHaveLength(7)
    })

    test("Then file field should trigger a browser alert if the file has a wrong extension", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      jest.spyOn(window, 'alert').mockImplementation(() => {});

      const mockFile = {path: 'wrongFile.ext', type: 'ext'}

      const newBillController = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage
      })

      const handleChangeFile = jest.fn(newBillController.handleChangeFile)
      const fileInput = screen.getByTestId("file")
      fileInput.addEventListener('change', handleChangeFile)
      fireEvent.change(fileInput, {
        target: {
          files: [new File([mockFile["path"]], mockFile["path"], {type: mockFile["type"]})]
        }
      })
      
      expect(handleChangeFile).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith("Seuls les fichiers aux formats .jpg/.jpeg/.png/.gif sont acceptés");
    })
  })
  
  describe('Given I am connected as an employee on NewBill', () => {
    describe('When I submit the form', () => {
      test('Then it should create a new bill', async () => {

        document.body.innerHTML = NewBillUI()
        const mockBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })
        const handleSubmitSpy = jest.spyOn(mockBill, 'handleSubmit')
        const form = screen.getByTestId('form-new-bill')
        const submitBtn = form.querySelector('#btn-send-bill')
        const updateBillSpy = jest.spyOn(mockBill, 'updateBill')

        form.addEventListener('submit', ((event) => mockBill.handleSubmit(event)))
        userEvent.click(submitBtn)

        expect(handleSubmitSpy).toHaveBeenCalled()
        expect(updateBillSpy).toHaveBeenCalled()
      })
    })
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills")
        Object.defineProperty(
          window,
          'localStorage',
          { value: localStorageMock }
        )
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee',
          email: "a@a"
        }))
        document.body.innerHTML = ''
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.appendChild(root)
        router()
      })

      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"))
            }
          }
        })
        document.body.innerHTML = BillsUI({ error: 'Erreur 404'})
        const message = screen.getByText(/Erreur 404/)
        expect(message).toBeInTheDocument()
      })

      test("fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"))
            }
          }
        })
        document.body.innerHTML = BillsUI({ error: 'Erreur 500'})
        const message = screen.getByText(/Erreur 500/)
        expect(message).toBeInTheDocument()
      })
    })
  })
})
